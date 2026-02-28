export const NETWORK_CONFIG = {
  mainnet: {
    rpcUrls: [
      'https://mainnet1.neo.coz.io:443',
      'https://mainnet2.neo.coz.io:443',
      'https://mainnet3.neo.coz.io:443',
      'https://mainnet4.neo.coz.io:443',
      'https://mainnet5.neo.coz.io:443',
      'http://seed1.neo.org:10332',
      'http://seed2.neo.org:10332',
      'http://seed3.neo.org:10332',
      'http://seed4.neo.org:10332',
      'http://seed5.neo.org:10332',
      'https://rpc10.n3.nspcc.ru:10331',
      'https://neo-rpc1.red4sec.com:443',
      'https://neo-rpc2.red4sec.com:443',
      'https://n3seed1.ngd.network:10332',
      'https://n3seed2.ngd.network:10332'
    ],
    magic: 860832277,
  },
  testnet: {
    rpcUrls: [
      'https://testnet1.neo.coz.io:443',
      'https://testnet2.neo.coz.io:443',
      'http://seed1t5.neo.org:20332',
      'http://seed2t5.neo.org:20332',
      'http://seed3t5.neo.org:20332',
      'http://seed4t5.neo.org:20332',
      'http://seed5t5.neo.org:20332',
      'https://rpc.t5.n3.nspcc.ru:20331'
    ],
    magic: 844378977,
  }
};

// Helper to provide backward compatibility for single rpcUrl access
for (const net in NETWORK_CONFIG) {
  NETWORK_CONFIG[net].rpcUrl = NETWORK_CONFIG[net].rpcUrls[0];
}
