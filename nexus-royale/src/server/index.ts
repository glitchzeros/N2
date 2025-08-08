import { GameServer } from './GameServer';

/**
 * Start the Nexus Royale game server
 */
async function startServer(): Promise<void> {
  const port = process.env.PORT ? parseInt(process.env.PORT) : 8080;
  
  console.log('🚀 Starting Nexus Royale Game Server...');
  console.log(`📡 Server will run on port ${port}`);
  
  try {
    const server = new GameServer(port);
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down server...');
      server.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Shutting down server...');
      server.shutdown();
      process.exit(0);
    });
    
    console.log('✅ Nexus Royale Game Server started successfully!');
    console.log('🎮 Ready to accept player connections');
    console.log('📊 Server stats will be logged every 30 seconds');
    
    // Log server stats periodically
    setInterval(() => {
      const stats = server.getStats();
      console.log(`📊 Server Stats - Rooms: ${stats.rooms}, Players: ${stats.players}, Queue: ${stats.matchmakingQueue}, Uptime: ${Math.floor(stats.uptime / 1000)}s`);
    }, 30000);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer();
}

export { startServer };