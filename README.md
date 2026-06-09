# Baileys WhatsApp API Wrapper

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/docker-supported-blue)](https://www.docker.com/)
[![GitHub issues](https://img.shields.io/github/issues/pointersoftware/Baileys-2025-Rest-API)](https://github.com/pointersoftware/Baileys-2025-Rest-API/issues)
[![GitHub stars](https://img.shields.io/github/stars/pointersoftware/Baileys-2025-Rest-API)](https://github.com/pointersoftware/Baileys-2025-Rest-APIstargazers)

A comprehensive REST API wrapper for the Baileys WhatsApp Web library with a management dashboard.

**Author:** [Abid](https://github.com/pointersoftware)

## Features

- 🚀 **REST API**: Complete REST API for all WhatsApp operations
- 📱 **Multi-Session**: Support for multiple WhatsApp sessions
- 🔐 **Authentication**: API key and JWT-based authentication
- 📊 **Dashboard**: Web-based management interface
- 🔗 **Webhooks**: Real-time event notifications
- 📝 **Documentation**: Interactive Swagger/OpenAPI documentation
- 🗄️ **Database**: PostgreSQL for session and message persistence
- 🔄 **Real-time**: WebSocket support for live updates

## Table of Contents

- [Features](#features)
- [Quick Start](#quick-start)
- [API Endpoints](#api-endpoints)
- [Authentication](#authentication)
- [Usage Examples](#usage-examples)
- [Dashboard](#dashboard)
- [Webhooks](#webhooks)
- [Environment Variables](#environment-variables)
- [Development](#development)
- [Contributing](#contributing)
- [Support](#support)
- [License](#license)

## Quick Start

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Yarn or npm

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/pointersoftware/Baileys-2025-Rest-API.git
cd baileys-api
```

2. **Run the setup script:**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Configure environment variables:**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL connection and other settings
```

4. **Set up the database:**
```bash
yarn db:generate
yarn migrate
```

5. **Start the development server:**
```bash
yarn dev
```

The API will be available at `http://localhost:3001`

### Quick Start with Docker

For the fastest setup, use Docker Compose:

```bash
# Clone and navigate to the project
git clone https://github.com/pointersoftware/Baileys-2025-Rest-API.git
cd baileys-api

# Start all services (API, PostgreSQL, Redis)
docker-compose up -d

# Run database migrations
docker-compose exec baileys-api npx prisma migrate deploy

# View logs
docker-compose logs -f baileys-api
```

Access the application:
- **API:** http://localhost:3001
- **Dashboard:** http://localhost:3001/dashboard
- **API Documentation:** http://localhost:3001/api-docs

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh-api-key` - Refresh API key

### Sessions
- `GET /api/sessions` - Get all user sessions
- `POST /api/sessions` - Create a new WhatsApp session
- `GET /api/sessions/{sessionId}` - Get session details
- `DELETE /api/sessions/{sessionId}` - Delete a session
- `GET /api/sessions/{sessionId}/qr` - Get QR code for session
- `POST /api/sessions/{sessionId}/pairing-code` - Request pairing code

### Messages
- `GET /api/messages/{sessionId}` - Get messages for a session
- `POST /api/messages/{sessionId}/send` - Send a text message
- `POST /api/messages/{sessionId}/send-media` - Send media message
- `POST /api/messages/{sessionId}/send-location` - Send location
- `POST /api/messages/{sessionId}/send-reaction` - Send reaction

### Chats
- `GET /api/chats/{sessionId}` - Get all chats
- `POST /api/chats/{sessionId}/{chatId}/archive` - Archive chat
- `POST /api/chats/{sessionId}/{chatId}/pin` - Pin chat
- `POST /api/chats/{sessionId}/{chatId}/mark-read` - Mark as read

### Groups
- `POST /api/groups/{sessionId}/create` - Create group
- `GET /api/groups/{sessionId}/{groupId}/metadata` - Get group metadata
- `POST /api/groups/{sessionId}/{groupId}/participants/add` - Add participants
- `POST /api/groups/{sessionId}/{groupId}/participants/remove` - Remove participants

### Contacts
- `GET /api/contacts/{sessionId}` - Get all contacts
- `GET /api/contacts/{sessionId}/{contactId}/profile-picture` - Get profile picture
- `POST /api/contacts/{sessionId}/{contactId}/block` - Block contact

### Webhooks
- `GET /api/webhooks` - Get user webhooks
- `POST /api/webhooks` - Create webhook
- `DELETE /api/webhooks/{webhookId}` - Delete webhook
- `POST /api/webhooks/{webhookId}/test` - Test webhook

## Authentication

The API supports two authentication methods:

### 1. API Key (Recommended)
Include your API key in the request header:
```
X-API-Key: your-api-key-here
```

### 2. JWT Token
Include the JWT token in the Authorization header:
```
Authorization: Bearer your-jwt-token-here
```

## Usage Examples

### Create a Session
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "sessionId": "my-session-1",
    "usePairingCode": false
  }'
```

### Send a Message
```bash
curl -X POST http://localhost:3001/api/messages/my-session-1/send \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "to": "1234567890@s.whatsapp.net",
    "content": {
      "text": "Hello from Baileys API!"
    }
  }'
```

### Send Media
```bash
curl -X POST http://localhost:3001/api/messages/my-session-1/send-media \
  -H "X-API-Key: your-api-key" \
  -F "to=1234567890@s.whatsapp.net" \
  -F "file=@/path/to/image.jpg" \
  -F "caption=Check out this image!"
```

## Dashboard

Access the web dashboard at `http://localhost:3001/dashboard` to:

- Monitor active sessions
- View connection status and logs
- Manage API keys and webhooks
- Test API endpoints
- View usage statistics

## Webhooks

Configure webhooks to receive real-time notifications:

```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "url": "https://your-server.com/webhook",
    "events": ["message.received", "connection.updated"],
    "secret": "your-webhook-secret"
  }'
```

### Webhook Events
- `message.received` - New message received
- `message.sent` - Message sent successfully
- `message.updated` - Message status updated
- `connection.updated` - Session connection status changed
- `chat.updated` - Chat information updated
- `contact.updated` - Contact information updated

## Environment Variables

Key environment variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/baileys_api"

# Security
JWT_SECRET=your-jwt-secret
API_KEY_SECRET=your-api-key-secret

# WhatsApp
WA_SESSION_TIMEOUT=300000
WA_MAX_RETRY_COUNT=3

# File Upload
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# Webhooks
WEBHOOK_SECRET=your-webhook-secret
WEBHOOK_TIMEOUT=10000
```

## Development

### Scripts
- `yarn dev` - Start development server
- `yarn build` - Build for production
- `yarn start` - Start production server
- `yarn test` - Run tests
- `yarn migrate` - Run database migrations
- `yarn db:studio` - Open Prisma Studio

### Project Structure
```
src/
├── controllers/     # API controllers
├── middleware/      # Express middleware
├── routes/          # API routes
├── services/        # Business logic services
├── types/           # TypeScript type definitions
├── utils/           # Utility functions
└── app.ts           # Main application file
```

## API Documentation

Interactive API documentation is available at:
`http://localhost:3001/api-docs`

## License

MIT License - see LICENSE file for details.

## Contributing

We welcome and appreciate contributions from the community! 🎉

### How to Contribute

1. **Fork the repository** and create your feature branch
2. **Make your changes** with clear, descriptive commit messages
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit a pull request** with a clear description of your changes

### Contribution Guidelines

- Follow the existing code style and conventions
- Write clear, concise commit messages
- Add tests for new features or bug fixes
- Update documentation for any API changes
- Be respectful and constructive in discussions

### Areas Where We Need Help

- 📝 **Documentation improvements**
- 🐛 **Bug fixes and testing**
- ✨ **New features and enhancements**
- 🌐 **Translations and internationalization**
- 🎨 **UI/UX improvements for the dashboard**

### Reporting Issues

Found a bug or have a feature request? Please:

1. **Check existing issues** to avoid duplicates
2. **Use issue templates** when available
3. **Provide detailed information** including:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node.js version, etc.)
   - Relevant logs or error messages

[**Report an Issue**](https://github.com/pointersoftware/Baileys-2025-Rest-API/issues/new) | [**Request a Feature**](https://github.com/pointersoftware/Baileys-2025-Rest-API/issues/new?template=feature_request.md)

## Support

### Supporting the Project

If you find this project helpful, please consider supporting its development:

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-support%20my%20work-FFDD00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://buymeacoffee.com/pointersoftware)

Your support helps maintain and improve this project for the entire community!

### Other Ways to Support

- ⭐ **Star this repository** to show your appreciation
- 🐛 **Report bugs** and help improve the project
- 📢 **Share the project** with others who might find it useful
- 💡 **Contribute code** or documentation improvements

### Getting Help

For questions and support:

- 📚 **Documentation**: Check the [API documentation](http://localhost:3001/api-docs) and this README
- 🐛 **Issues**: [Open an issue](https://github.com/pointersoftware/Baileys-2025-Rest-API/issues) for bugs or feature requests
- 💬 **Discussions**: Join [GitHub Discussions](https://github.com/pointersoftware/Baileys-2025-Rest-API/discussions) for general questions
- 📖 **Baileys Docs**: Review the [original Baileys documentation](https://github.com/WhiskeySockets/Baileys)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This project is not affiliated with WhatsApp Inc. Use responsibly and in accordance with WhatsApp's Terms of Service. The maintainers are not responsible for any misuse of this software.

## Acknowledgments

- Thanks to the [Baileys](https://github.com/WhiskeySockets/Baileys) team for the excellent WhatsApp Web library
- All contributors who help improve this project
- The open-source community for inspiration and support

---

<div align="center">

**Made with ❤️ by [Abid](https://github.com/pointersoftware)**

If this project helped you, please consider [buying me a coffee](https://buymeacoffee.com/pointersoftware) ☕

</div>
