declare module 'crypto-js' {
  namespace AES {
    function encrypt(message: string, key: string): any;
    function decrypt(ciphertext: any, key: string): any;
  }

  namespace enc {
    const Utf8: any;
  }
} 