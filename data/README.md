# Data Storage Directory

This directory contains persistent data for the Fractal Engine:

- **chats/**: Individual chat project files with their own settings and logs
- **functions/**: Shared function configurations that can be imported/exported
- **projects/**: Complete project export files containing chat history, functions, and settings
- **logs/**: System and error logs
- **backups/**: Automatic backups of important data

## File Structure

```
data/
├── chats/
│   ├── {chat-id}/
│   │   ├── metadata.json
│   │   ├── messages.json
│   │   ├── console-logs.json
│   │   └── settings.json
├── functions/
│   └── {function-config-files}.func
├── projects/
│   └── {project-files}.fractal
└── logs/
    ├── system.log
    └── error.log
```