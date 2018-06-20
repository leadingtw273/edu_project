const crypto = require('crypto');

let _aesParam = new WeakMap();

class AES256 {

  /**
   * AES256 的 constructor
   * @param {string} hash hash模式
   * @param {string} aes aes模式
   */
  constructor(hash, aes) {
    _aesParam.set(this, {
      hashMode: '',
      aesMode: '',
      key: ''
    });
    let privateData = _aesParam.get(this);
    privateData.hashMode = hash;
    privateData.aesMode = aes;
  }

  /**
   * 將傳入值進行hash運算
   * @param {string} chaosData 傳入值
   */
  setKey(chaosData) {
    let privateData = _aesParam.get(this);
    // hash 混沌產生值 轉成對稱金鑰
    let hash = crypto.createHash(privateData.hashMode);
    privateData.key = hash.update(chaosData).digest();
    return privateData.key;
  }

  setNoHashKey(chaosData) {
    let privateData = _aesParam.get(this);
    privateData.key = chaosData;
    return privateData.key;
  }

  /**
   * 將傳入值進行AES加密運算
   * @param {*} data 傳入值
   */
  encryp(data) {
    let privateData = _aesParam.get(this);
    // aes256-ecb加密 
    let aes256Enc = crypto.createCipher(privateData.aesMode, privateData.key).setAutoPadding(false);
    let sendData = aes256Enc.update(data);

    try {
      // sendData += aes256Enc.final();
      sendData = Buffer.concat([sendData, aes256Enc.final()]);
    } catch (e) {
      return 'error';
    }
    return sendData;
  }

  /**
   * 將傳入值進行AES解密運算
   * @param {*} data 傳入值
   */
  decryp(data) {
    let privateData = _aesParam.get(this);
    //aes256-ecb 解密
    let aes256Dec = crypto.createDecipher(privateData.aesMode, privateData.key).setAutoPadding(false);
    let getData = aes256Dec.update(data);

    try {
      //getData += aes256Dec.final();
      getData = Buffer.concat([getData, aes256Dec.final()]);
    } catch (e) {
      return 'error';
    }

    return getData;
  }
}

module.exports = AES256;