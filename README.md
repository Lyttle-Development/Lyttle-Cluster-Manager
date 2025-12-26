# Lyttle Cluster Manager

A Next.js-based management dashboard for the distributed LyttleNGINX cluster. This application provides a user-friendly interface for managing proxy configurations, SSL certificates, and cluster nodes.

## Features

### 🔐 Certificate Management

- View all SSL certificates with expiry tracking
- Upload custom certificates (PEM format)
- Generate self-signed certificates for development
- Manual certificate renewal
- Status indicators (Active, Expiring Soon, Expired, Failed)

### 🌐 Proxy Management

- Manage NGINX proxy entries
- Support for reverse proxy and redirects
- SSL configuration per domain
- Custom NGINX configuration snippets
- Cluster-wide configuration synchronization
- Live logs during reload

### 🖥️ Cluster Management

- Real-time cluster node monitoring
- Leader election status
- Cluster health dashboard
- Admin tools for maintenance:
    - Cleanup stale nodes
    - Enforce single leader
    - Ensure leader exists

### 🔒 Security

- Google OAuth authentication
- API token authentication
- Secure proxy to LyttleNGINX cluster API

## Architecture

This application is the management frontend for a distributed LyttleNGINX cluster:

- **Frontend**: Next.js 14+ with TypeScript and React 19
- **Backend**: Proxies requests to LyttleNGINX cluster
- **Database**: PostgreSQL (shared with LyttleNGINX)
- **Styling**: SCSS modules with custom design system

## Getting Started

### Prerequisites

- Node.js 24.11.1+ (uses Volta)
- PostgreSQL database
- Running LyttleNGINX cluster

### Installation

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables (see `.env` file):

```env
DATABASE_URL=postgresql://...
NGINX_API_URL=http://your-nginx-cluster:3000
NGINX_API_KEY=your-secure-api-key
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXTAUTH_SECRET=...
```

3. Generate Prisma client:

```bash
npm run prisma:generate
```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:1111](http://localhost:1111) with your browser.

### Production Build

```bash
npm run build
npm start
```

## Environment Variables

| Variable               | Description                                     | Required |
|------------------------|-------------------------------------------------|----------|
| `DATABASE_URL`         | PostgreSQL connection string                    | Yes      |
| `NGINX_API_URL`        | LyttleNGINX cluster API URL                     | Yes      |
| `NGINX_API_KEY`        | API key for LyttleNGINX authentication          | Yes      |
| `GOOGLE_CLIENT_ID`     | Google OAuth client ID                          | Yes      |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret                      | Yes      |
| `NEXTAUTH_SECRET`      | NextAuth.js secret for session encryption       | Yes      |
| `NEXTAUTH_URL`         | Full URL of the application                     | Yes      |
| `API_TOKEN`            | Alternative API token for authentication        | No       |
| `ALLOWED_USERS`        | Comma-separated list of allowed email addresses | No       |

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes (proxy to LyttleNGINX)
│   │   ├── auth/         # Authentication endpoints
│   │   ├── certificates/ # Certificate management API
│   │   ├── cluster/      # Cluster management API
│   │   └── nginx/        # Proxy management API
│   ├── certificates/     # Certificate management page
│   ├── cluster/          # Cluster management page
│   └── nginx/            # Proxy management page
├── components/           # Reusable React components
│   ├── Clusters/
│   ├── MainNavigation/
│   └── ...
├── hooks/                # Custom React hooks
├── styles/               # Global styles and variables
└── utils/                # Utility functions
```

## Key Technologies

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript 5.9
- **Database ORM**: Prisma 7.2
- **Authentication**: NextAuth.js 4
- **Styling**: SCSS Modules
- **Icons**: FontAwesome
- **Node Version**: 24.11.1 (managed by Volta)

## Development

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:format` - Format Prisma schema
- `npm run update` - Update all dependencies

### Database Migrations

This application shares a database with LyttleNGINX. Schema changes should be coordinated:

1. Update `prisma/schema.prisma`
2. Generate Prisma client: `npm run prisma:generate`
3. Apply migrations (if needed): `npm run prisma:migrate`

## Deployment

### Docker

```bash
npm run docker:setup
npm run docker:build
docker run -p 1111:1111 community-v3-dashboard
```

### Manual Deployment

1. Build the application: `npm run build`
2. Set environment variables
3. Start the server: `npm start`

## Integration with LyttleNGINX

This dashboard communicates with the LyttleNGINX cluster via REST API:

- All certificate and cluster operations are proxied to LyttleNGINX
- Configuration changes trigger cluster-wide reloads
- Authentication is handled by this application, then forwarded with API key

See [UPDATE_NOTES.md](./UPDATE_NOTES.md) for detailed integration documentation.

## Security Considerations

- All API requests require authentication (Google OAuth or API token)
- LyttleNGINX API key is kept server-side (never exposed to client)
- HTTPS should be used in production
- Database credentials should be properly secured
- Rate limiting is handled by LyttleNGINX

## Troubleshooting

### Cannot connect to LyttleNGINX cluster

- Verify `NGINX_API_URL` is correct and accessible
- Check `NGINX_API_KEY` matches the cluster configuration
- Ensure network connectivity between services

### Certificate operations fail

- Check LyttleNGINX logs for detailed error messages
- Verify certificate format (must be PEM)
- Ensure domains match between certificate and request

### Cluster shows unhealthy status

- Use admin tools in the Cluster page to fix issues
- Check individual node status and heartbeats
- Review LyttleNGINX documentation for cluster troubleshooting

## License

Private - Lyttle Development

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [LyttleNGINX Repository](../LyttleNGINX)
- [Prisma Documentation](https://www.prisma.io/docs)

````
