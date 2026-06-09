import { PrismaClient } from '@prisma/client';
import { proto } from '../../WAProto';
import { AuthenticationCreds, AuthenticationState, SignalDataTypeMap } from '../Types';
import { initAuthCreds } from './auth-utils';
import { BufferJSON } from './generics';

type SignalDataSet = {
  [T in keyof SignalDataTypeMap]?: { [id: string]: SignalDataTypeMap[T] | null };
};

/**
 * useDatabaseAuthState
 *
 * A PostgreSQL-backed Baileys authentication state using Prisma.
 * Replaces useMultiFileAuthState (filesystem) with database persistence,
 * ensuring WhatsApp sessions survive server restarts and redeployments on
 * ephemeral hosting platforms like Render.
 *
 * Credentials and signal keys are stored as JSON in Session.authData.
 * No extra tables required — uses the existing sessions table.
 *
 * @param sessionId - Unique session identifier
 * @param prisma - Active PrismaClient instance
 */
export const useDatabaseAuthState = async (
  sessionId: string,
  prisma: PrismaClient
): Promise<{ state: AuthenticationState; saveCreds: () => Promise<void> }> => {

  // Load persisted auth data from database
  const record = await prisma.session.findUnique({
    where: { sessionId },
    select: { authData: true },
  });

  // Working copy of all auth data — mutated in memory, flushed to DB on each write
  const authData: Record<string, unknown> = (record?.authData as Record<string, unknown>) ?? {};

  const readData = (key: string): unknown => {
    const value = authData[key];
    if (value === undefined || value === null) return null;
    return JSON.parse(JSON.stringify(value), BufferJSON.reviver);
  };

  const flushToDB = async (): Promise<void> => {
    await prisma.session.update({
      where: { sessionId },
      data: { authData },
    });
  };

  // Restore or initialise credentials
  const creds: AuthenticationCreds = (readData('creds') as AuthenticationCreds) ?? initAuthCreds();

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async (type, ids) => {
        const result: { [_: string]: SignalDataTypeMap[typeof type] } = {};
        for (const id of ids) {
          let value = readData(`${type}-${id}`);
          if (type === 'app-state-sync-key' && value) {
            value = proto.Message.AppStateSyncKeyData.fromObject(value);
          }
          result[id] = value as SignalDataTypeMap[typeof type];
        }
        return result;
      },

      set: async (data: SignalDataSet) => {
        // Batch all key changes in memory then do a single DB write
        for (const category in data) {
          const categoryData = data[category as keyof typeof data];
          for (const id in categoryData) {
            const value = categoryData![id];
            const key = `${category}-${id}`;
            if (value !== null && value !== undefined) {
              authData[key] = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
            } else {
              delete authData[key];
            }
          }
        }
        await flushToDB();
      },
    },
  };

  const saveCreds = async (): Promise<void> => {
    authData['creds'] = JSON.parse(JSON.stringify(creds, BufferJSON.replacer));
    await flushToDB();
  };

  return { state, saveCreds };
};
