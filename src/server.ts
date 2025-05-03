import app from './app';
import dotenv from 'dotenv';
import os from 'os';

dotenv.config();

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Get network interfaces
const networkInterfaces = os.networkInterfaces();
const networkAddresses: string[] = [];

// Find IPv4 addresses
Object.values(networkInterfaces).forEach((interfaces) => {
  interfaces?.forEach((interfaceInfo) => {
    if (interfaceInfo.family === 'IPv4' && !interfaceInfo.internal) {
      networkAddresses.push(interfaceInfo.address);
    }
  });
});

app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  networkAddresses.forEach((address) => {
    console.log(`Network: http://${address}:${PORT}`);
  });
});
