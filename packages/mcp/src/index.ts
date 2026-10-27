import { StellarAgentTools } from './tools';

export * from './tools';

async function runMcpServer() {
  const tools = new StellarAgentTools();
  console.error('Stellar Modular Developer MCP Server initialized (stdio mode).');

  process.stdin.on('data', async (chunk) => {
    try {
      const line = chunk.toString().trim();
      if (!line) return;
      const msg = JSON.parse(line);

      if (msg.method === 'tools/list') {
        const response = {
          jsonrpc: '2.0',
          id: msg.id,
          result: {
            tools: [
              {
                name: 'stellar_list_monetized_services',
                description: 'List all APIs registered on the Stellar Modular Developer contract with pricing',
                inputSchema: { type: 'object', properties: {} },
              },
              {
                name: 'stellar_pay_and_call_endpoint',
                description: 'Execute an HTTP request to an x402-monetized endpoint and settle payment on Stellar Testnet',
                inputSchema: {
                  type: 'object',
                  properties: {
                    url: { type: 'string', description: 'Proxied endpoint URL (e.g. http://localhost:4020/p/weather_api)' },
                    method: { type: 'string', default: 'GET' },
                    body: { type: 'object' },
                  },
                  required: ['url'],
                },
              },
            ],
          },
        };
        process.stdout.write(JSON.stringify(response) + '\n');
      } else if (msg.method === 'tools/call') {
        const { name, arguments: args } = msg.params;
        let result: any;
        if (name === 'stellar_list_monetized_services') {
          result = await tools.listServices();
        } else if (name === 'stellar_pay_and_call_endpoint') {
          result = await tools.payAndCall(args.url, args.method, args.body);
        }
        process.stdout.write(JSON.stringify({ jsonrpc: '2.0', id: msg.id, result }) + '\n');
      }
    } catch (e: any) {
      process.stderr.write(`MCP Error: ${e.message}\n`);
    }
  });
}

if (require.main === module) {
  runMcpServer().catch(console.error);
}
