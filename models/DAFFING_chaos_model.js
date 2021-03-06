const f = require('float');

let _chaosParam = new WeakMap();

class Chaos {

  /**
   * Chaos 的 constructor
   * @param {number} A α 參數
   * @param {number} R R 參數
   * @param {number} c c 參數
   */
  constructor(A, R, c) {

    _chaosParam.set(this, {
      A: 0,
      R: 1,
      c: 0,
      ax: [1, 1],
      dx: [0, 0],
      g: [],
      h: [],
      count: 0
    });

    let privateData = _chaosParam.get(this);
    privateData.A = A;
    privateData.R = R;
    privateData.c = c;

    this.runModulation();
  }

  /**
   * 設定調變參數
   * @param  {number[]} ax 振幅調變
   * @param  {number[]} dx 準位調變
   */
  setModulation(ax, dx) {
    let privateData = _chaosParam.get(this);
    privateData.ax = ax;
    privateData.dx = dx;

    this.runModulation();
  }

  /**
   * 執行調變參數運算，
   * 求出 (g) (h) 的值
   */
  runModulation() {
    let privateData = _chaosParam.get(this);
    let ax = privateData.ax;
    let dx = privateData.dx;

    privateData.g[0] = -0.2 * ax[1] / ax[0];
    privateData.g[1] = -1 / (ax[1] * ax[1]);
    privateData.g[2] = 3 * dx[1] / (ax[1] * ax[1]);
    privateData.g[3] = 2.75 - 3 * (dx[1] * dx[1]) / (ax[1] * ax[1]);
    privateData.g[4] = 0.2 * dx[0] * ax[1] / ax[0] - 2.75 * dx[1] + (dx[1] * dx[1] * dx[1]) / (ax[1] * ax[1]) + dx[1];

    privateData.h[0] = ax[0] / ax[1];
    privateData.h[1] = -ax[0] / ax[1] * dx[1] + dx[0];
  }

  /**
   * 混沌運算
   * @param {number} k 狀態值
   * @param {number[]} x 前值
   * @return {number[]} 回傳現值
   */
  runChaos(k, x) {
    let privateData = _chaosParam.get(this);
    let t = [];

    let g = privateData.g;
    let h = privateData.h;

    if (k <= 1) {

      x[0] = (privateData.ax[0] * x[0]) + privateData.dx[0];
      x[1] = (privateData.ax[1] * x[1]) + privateData.dx[1];

    }

    t = x.slice();
    t[0] = f.round(h[0] * x[1], 10);
    t[1] = f.round(g[0] * x[0] + g[1] * (x[1] * x[1] * x[1]) + g[2] * (x[1] * x[1]) + g[3] * x[1] + g[4], 10);

    return t;
  }

  /**
   * 主混沌運算
   * @param {number} k 狀態值
   * @param {number[]} x 前值
   * @return {number[]} 回傳現值
   */
  runMaster(k, x) {
    return this.runChaos(k, x);
  }

  /**
   * 僕混沌運算
   * @param {number} k 狀態值
   * @param {number[]} x 前值
   * @param {number} Um 主端控制器
   * @return {number[]} 回傳經過同步運算的值
   */
  runSlave(k, x, Um) {
    let t = this.runChaos(k, x);
    if (k > 1) {
      t[0] = f.round(t[0] + this.createUs(x) + Um, 10);
    }
    return t;
  }

  /**
   * 計算同步控制器(Uk)
   * @param {number[]} X 主端值
   * @param {number[]} Y 僕端值
   * @return {number} 回傳同步控制器
   */
  createUk(X, Y) {

    let Um = this.createUm(X);
    let Us = this.createUs(Y);

    return f.round(Um + Us, 6);
  }

  /**
   * 計算主端控制器(Um)
   * @param {number[]} x 主端值
   * @return {number} 回傳主端控制器
   */
  createUm(x) {
    let privateData = _chaosParam.get(this);
    let A = privateData.A;
    let R = privateData.R;
    let c = privateData.c;
    let g = privateData.g;
    let h = privateData.h;

    //let Um = Math.pow(x[1], 2) * g[0] + x[1] * g[1] + x[2] * g[2] + x[0] * c[0] * h[0] + x[1] * c[1] * j[0] - x[0] * A - x[1] * c[0] * A - x[2] * c[1] * A;
    let Um = R*(+g[0]*x[0]+g[1]*Math.pow((x[1]), 3)+g[2]*Math.pow((x[1]),2)+g[3]*x[1]+c*h[0]*x[1]-c*A*x[0]-A*x[1]);
    //let Us = (-g[0]*y[0]-g[1]*Math.pow((y[1]), 3)-g[2]*Math.pow((y[1]),2)-g[3]*y[1]-c*h[0]*y[1]+c*A*y[0]+A*y[1])-g[4]*(1-R)-A*h[1]*(1-R);
    return f.round(Um, 10);

  }

  /**
   * 計算僕端控制器(Us)
   * @param {number[]} y 僕端值
   * @return {number} 回傳僕端控制器
   */
  createUs(y) {
    let privateData = _chaosParam.get(this);
    let A = privateData.A;
    let R = privateData.R;
    let c = privateData.c;
    let g = privateData.g;
    let h = privateData.h;

    //let Us = (-Math.pow(y[1], 2) * g[0] - y[1] * g[1] - y[2] * g[2] - y[0] * c[0] * h[0] - y[1] * c[1] * j[0] + y[0] * A + y[1] * c[0] * A + y[2] * c[1] * A);
    let xx = -g[4]*(1-R)-A*h[1]*(1-R);
    console.log(xx);
    let Us = (-g[0]*y[0]-g[1]*Math.pow((y[1]), 3)-g[2]*Math.pow((y[1]),2)-g[3]*y[1]-c*h[0]*y[1]+c*A*y[0]+A*y[1])-g[4]*(1-R)-A*h[1]*(1-R);
    return f.round(Us, 10);

  }

  /**
   * 確認兩混沌系統是否同步
   * @param {number[]} a1 比對值(a1)
   * @param {number[]} a2 比對值(a2)
   * @return {boolean} 回傳是否同步
   */
  checkSync(Us, Um) {
    let privateData = _chaosParam.get(this);
    let sync = false;

    Um = f.round(Um, 4);
    Us = f.round(Us, 4);

    if ((Us + Um) == 0) {
      privateData.count = privateData.count + 1;

      if (privateData.count >= 10) {
        sync = true;
      }

    } else {
      privateData.count = 0;
    }



    return sync;
  }

  /**
   * 顯示測試
   */
  show() {
    let privateData = _chaosParam.get(this);
    console.log(`A = ${privateData.A}, c = ${privateData.c}, g = ${privateData.g}, h = ${privateData.h}, j = ${privateData.j}`);
  }

}

module.exports = Chaos;
