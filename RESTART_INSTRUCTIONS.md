# Quick Restart Instructions

If Rocket.Chat crashes, use these commands:

## Quick Restart
```bash
cd /Users/te/rocket
pkill -f "meteor.*4000"
sleep 2
cd Rocket.Chat
./start-dev.sh
```

## Check Status
```bash
# Check if server is running
curl http://localhost:4000/api/info

# Check if process is running
ps aux | grep meteor

# Check MongoDB
docker ps | grep mongo
```

## If It Keeps Crashing

1. **Check the terminal output** where Rocket.Chat is running for error messages
2. **Check MongoDB** is running: `docker ps | grep mongo`
3. **Check for port conflicts**: `lsof -i :4000`
4. **Restart MongoDB** if needed: `docker restart rocketchat-mongo-1`

## Common Issues

- **Port already in use**: Kill the process or use a different port
- **MongoDB not running**: Start MongoDB container
- **Import errors**: Already fixed, but check if new errors appear
- **Memory issues**: Check system resources

