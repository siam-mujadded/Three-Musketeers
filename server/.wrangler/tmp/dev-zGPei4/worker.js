var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};

// .wrangler/tmp/bundle-yNNZJX/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// node_modules/unenv/dist/runtime/_internal/utils.mjs
function createNotImplementedError(name) {
  return new Error(`[unenv] ${name} is not implemented yet!`);
}
__name(createNotImplementedError, "createNotImplementedError");
function notImplemented(name) {
  const fn = /* @__PURE__ */ __name(() => {
    throw createNotImplementedError(name);
  }, "fn");
  return Object.assign(fn, { __unenv__: true });
}
__name(notImplemented, "notImplemented");
function notImplementedClass(name) {
  return class {
    __unenv__ = true;
    constructor() {
      throw new Error(`[unenv] ${name} is not implemented yet!`);
    }
  };
}
__name(notImplementedClass, "notImplementedClass");

// node_modules/unenv/dist/runtime/node/internal/perf_hooks/performance.mjs
var _timeOrigin = globalThis.performance?.timeOrigin ?? Date.now();
var _performanceNow = globalThis.performance?.now ? globalThis.performance.now.bind(globalThis.performance) : () => Date.now() - _timeOrigin;
var nodeTiming = {
  name: "node",
  entryType: "node",
  startTime: 0,
  duration: 0,
  nodeStart: 0,
  v8Start: 0,
  bootstrapComplete: 0,
  environment: 0,
  loopStart: 0,
  loopExit: 0,
  idleTime: 0,
  uvMetricsInfo: {
    loopCount: 0,
    events: 0,
    eventsWaiting: 0
  },
  detail: void 0,
  toJSON() {
    return this;
  }
};
var PerformanceEntry = class {
  __unenv__ = true;
  detail;
  entryType = "event";
  name;
  startTime;
  constructor(name, options) {
    this.name = name;
    this.startTime = options?.startTime || _performanceNow();
    this.detail = options?.detail;
  }
  get duration() {
    return _performanceNow() - this.startTime;
  }
  toJSON() {
    return {
      name: this.name,
      entryType: this.entryType,
      startTime: this.startTime,
      duration: this.duration,
      detail: this.detail
    };
  }
};
__name(PerformanceEntry, "PerformanceEntry");
var PerformanceMark = /* @__PURE__ */ __name(class PerformanceMark2 extends PerformanceEntry {
  entryType = "mark";
  constructor() {
    super(...arguments);
  }
  get duration() {
    return 0;
  }
}, "PerformanceMark");
var PerformanceMeasure = class extends PerformanceEntry {
  entryType = "measure";
};
__name(PerformanceMeasure, "PerformanceMeasure");
var PerformanceResourceTiming = class extends PerformanceEntry {
  entryType = "resource";
  serverTiming = [];
  connectEnd = 0;
  connectStart = 0;
  decodedBodySize = 0;
  domainLookupEnd = 0;
  domainLookupStart = 0;
  encodedBodySize = 0;
  fetchStart = 0;
  initiatorType = "";
  name = "";
  nextHopProtocol = "";
  redirectEnd = 0;
  redirectStart = 0;
  requestStart = 0;
  responseEnd = 0;
  responseStart = 0;
  secureConnectionStart = 0;
  startTime = 0;
  transferSize = 0;
  workerStart = 0;
  responseStatus = 0;
};
__name(PerformanceResourceTiming, "PerformanceResourceTiming");
var PerformanceObserverEntryList = class {
  __unenv__ = true;
  getEntries() {
    return [];
  }
  getEntriesByName(_name, _type) {
    return [];
  }
  getEntriesByType(type) {
    return [];
  }
};
__name(PerformanceObserverEntryList, "PerformanceObserverEntryList");
var Performance = class {
  __unenv__ = true;
  timeOrigin = _timeOrigin;
  eventCounts = /* @__PURE__ */ new Map();
  _entries = [];
  _resourceTimingBufferSize = 0;
  navigation = void 0;
  timing = void 0;
  timerify(_fn, _options) {
    throw createNotImplementedError("Performance.timerify");
  }
  get nodeTiming() {
    return nodeTiming;
  }
  eventLoopUtilization() {
    return {};
  }
  markResourceTiming() {
    return new PerformanceResourceTiming("");
  }
  onresourcetimingbufferfull = null;
  now() {
    if (this.timeOrigin === _timeOrigin) {
      return _performanceNow();
    }
    return Date.now() - this.timeOrigin;
  }
  clearMarks(markName) {
    this._entries = markName ? this._entries.filter((e) => e.name !== markName) : this._entries.filter((e) => e.entryType !== "mark");
  }
  clearMeasures(measureName) {
    this._entries = measureName ? this._entries.filter((e) => e.name !== measureName) : this._entries.filter((e) => e.entryType !== "measure");
  }
  clearResourceTimings() {
    this._entries = this._entries.filter((e) => e.entryType !== "resource" || e.entryType !== "navigation");
  }
  getEntries() {
    return this._entries;
  }
  getEntriesByName(name, type) {
    return this._entries.filter((e) => e.name === name && (!type || e.entryType === type));
  }
  getEntriesByType(type) {
    return this._entries.filter((e) => e.entryType === type);
  }
  mark(name, options) {
    const entry = new PerformanceMark(name, options);
    this._entries.push(entry);
    return entry;
  }
  measure(measureName, startOrMeasureOptions, endMark) {
    let start;
    let end;
    if (typeof startOrMeasureOptions === "string") {
      start = this.getEntriesByName(startOrMeasureOptions, "mark")[0]?.startTime;
      end = this.getEntriesByName(endMark, "mark")[0]?.startTime;
    } else {
      start = Number.parseFloat(startOrMeasureOptions?.start) || this.now();
      end = Number.parseFloat(startOrMeasureOptions?.end) || this.now();
    }
    const entry = new PerformanceMeasure(measureName, {
      startTime: start,
      detail: {
        start,
        end
      }
    });
    this._entries.push(entry);
    return entry;
  }
  setResourceTimingBufferSize(maxSize) {
    this._resourceTimingBufferSize = maxSize;
  }
  addEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.addEventListener");
  }
  removeEventListener(type, listener, options) {
    throw createNotImplementedError("Performance.removeEventListener");
  }
  dispatchEvent(event) {
    throw createNotImplementedError("Performance.dispatchEvent");
  }
  toJSON() {
    return this;
  }
};
__name(Performance, "Performance");
var PerformanceObserver = class {
  __unenv__ = true;
  _callback = null;
  constructor(callback) {
    this._callback = callback;
  }
  takeRecords() {
    return [];
  }
  disconnect() {
    throw createNotImplementedError("PerformanceObserver.disconnect");
  }
  observe(options) {
    throw createNotImplementedError("PerformanceObserver.observe");
  }
  bind(fn) {
    return fn;
  }
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.call(thisArg, ...args);
  }
  asyncId() {
    return 0;
  }
  triggerAsyncId() {
    return 0;
  }
  emitDestroy() {
    return this;
  }
};
__name(PerformanceObserver, "PerformanceObserver");
__publicField(PerformanceObserver, "supportedEntryTypes", []);
var performance = globalThis.performance && "addEventListener" in globalThis.performance ? globalThis.performance : new Performance();

// node_modules/@cloudflare/unenv-preset/dist/runtime/polyfill/performance.mjs
globalThis.performance = performance;
globalThis.Performance = Performance;
globalThis.PerformanceEntry = PerformanceEntry;
globalThis.PerformanceMark = PerformanceMark;
globalThis.PerformanceMeasure = PerformanceMeasure;
globalThis.PerformanceObserver = PerformanceObserver;
globalThis.PerformanceObserverEntryList = PerformanceObserverEntryList;
globalThis.PerformanceResourceTiming = PerformanceResourceTiming;

// node_modules/unenv/dist/runtime/node/console.mjs
import { Writable } from "node:stream";

// node_modules/unenv/dist/runtime/mock/noop.mjs
var noop_default = Object.assign(() => {
}, { __unenv__: true });

// node_modules/unenv/dist/runtime/node/console.mjs
var _console = globalThis.console;
var _ignoreErrors = true;
var _stderr = new Writable();
var _stdout = new Writable();
var log = _console?.log ?? noop_default;
var info = _console?.info ?? log;
var trace = _console?.trace ?? info;
var debug = _console?.debug ?? log;
var table = _console?.table ?? log;
var error = _console?.error ?? log;
var warn = _console?.warn ?? error;
var createTask = _console?.createTask ?? /* @__PURE__ */ notImplemented("console.createTask");
var clear = _console?.clear ?? noop_default;
var count = _console?.count ?? noop_default;
var countReset = _console?.countReset ?? noop_default;
var dir = _console?.dir ?? noop_default;
var dirxml = _console?.dirxml ?? noop_default;
var group = _console?.group ?? noop_default;
var groupEnd = _console?.groupEnd ?? noop_default;
var groupCollapsed = _console?.groupCollapsed ?? noop_default;
var profile = _console?.profile ?? noop_default;
var profileEnd = _console?.profileEnd ?? noop_default;
var time = _console?.time ?? noop_default;
var timeEnd = _console?.timeEnd ?? noop_default;
var timeLog = _console?.timeLog ?? noop_default;
var timeStamp = _console?.timeStamp ?? noop_default;
var Console = _console?.Console ?? /* @__PURE__ */ notImplementedClass("console.Console");
var _times = /* @__PURE__ */ new Map();
var _stdoutErrorHandler = noop_default;
var _stderrErrorHandler = noop_default;

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/console.mjs
var workerdConsole = globalThis["console"];
var {
  assert,
  clear: clear2,
  // @ts-expect-error undocumented public API
  context,
  count: count2,
  countReset: countReset2,
  // @ts-expect-error undocumented public API
  createTask: createTask2,
  debug: debug2,
  dir: dir2,
  dirxml: dirxml2,
  error: error2,
  group: group2,
  groupCollapsed: groupCollapsed2,
  groupEnd: groupEnd2,
  info: info2,
  log: log2,
  profile: profile2,
  profileEnd: profileEnd2,
  table: table2,
  time: time2,
  timeEnd: timeEnd2,
  timeLog: timeLog2,
  timeStamp: timeStamp2,
  trace: trace2,
  warn: warn2
} = workerdConsole;
Object.assign(workerdConsole, {
  Console,
  _ignoreErrors,
  _stderr,
  _stderrErrorHandler,
  _stdout,
  _stdoutErrorHandler,
  _times
});
var console_default = workerdConsole;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-console
globalThis.console = console_default;

// node_modules/unenv/dist/runtime/node/internal/process/hrtime.mjs
var hrtime = /* @__PURE__ */ Object.assign(/* @__PURE__ */ __name(function hrtime2(startTime) {
  const now = Date.now();
  const seconds = Math.trunc(now / 1e3);
  const nanos = now % 1e3 * 1e6;
  if (startTime) {
    let diffSeconds = seconds - startTime[0];
    let diffNanos = nanos - startTime[0];
    if (diffNanos < 0) {
      diffSeconds = diffSeconds - 1;
      diffNanos = 1e9 + diffNanos;
    }
    return [diffSeconds, diffNanos];
  }
  return [seconds, nanos];
}, "hrtime"), { bigint: /* @__PURE__ */ __name(function bigint() {
  return BigInt(Date.now() * 1e6);
}, "bigint") });

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
import { EventEmitter } from "node:events";

// node_modules/unenv/dist/runtime/node/internal/tty/read-stream.mjs
import { Socket } from "node:net";
var ReadStream = class extends Socket {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  isRaw = false;
  setRawMode(mode) {
    this.isRaw = mode;
    return this;
  }
  isTTY = false;
};
__name(ReadStream, "ReadStream");

// node_modules/unenv/dist/runtime/node/internal/tty/write-stream.mjs
import { Socket as Socket2 } from "node:net";
var WriteStream = class extends Socket2 {
  fd;
  constructor(fd) {
    super();
    this.fd = fd;
  }
  clearLine(dir3, callback) {
    callback && callback();
    return false;
  }
  clearScreenDown(callback) {
    callback && callback();
    return false;
  }
  cursorTo(x, y, callback) {
    callback && typeof callback === "function" && callback();
    return false;
  }
  moveCursor(dx, dy, callback) {
    callback && callback();
    return false;
  }
  getColorDepth(env2) {
    return 1;
  }
  hasColors(count3, env2) {
    return false;
  }
  getWindowSize() {
    return [this.columns, this.rows];
  }
  columns = 80;
  rows = 24;
  isTTY = false;
};
__name(WriteStream, "WriteStream");

// node_modules/unenv/dist/runtime/node/internal/process/process.mjs
var Process = class extends EventEmitter {
  env;
  hrtime;
  nextTick;
  constructor(impl) {
    super();
    this.env = impl.env;
    this.hrtime = impl.hrtime;
    this.nextTick = impl.nextTick;
    for (const prop of [...Object.getOwnPropertyNames(Process.prototype), ...Object.getOwnPropertyNames(EventEmitter.prototype)]) {
      const value = this[prop];
      if (typeof value === "function") {
        this[prop] = value.bind(this);
      }
    }
  }
  emitWarning(warning, type, code) {
    console.warn(`${code ? `[${code}] ` : ""}${type ? `${type}: ` : ""}${warning}`);
  }
  emit(...args) {
    return super.emit(...args);
  }
  listeners(eventName) {
    return super.listeners(eventName);
  }
  #stdin;
  #stdout;
  #stderr;
  get stdin() {
    return this.#stdin ??= new ReadStream(0);
  }
  get stdout() {
    return this.#stdout ??= new WriteStream(1);
  }
  get stderr() {
    return this.#stderr ??= new WriteStream(2);
  }
  #cwd = "/";
  chdir(cwd2) {
    this.#cwd = cwd2;
  }
  cwd() {
    return this.#cwd;
  }
  arch = "";
  platform = "";
  argv = [];
  argv0 = "";
  execArgv = [];
  execPath = "";
  title = "";
  pid = 200;
  ppid = 100;
  get version() {
    return "";
  }
  get versions() {
    return {};
  }
  get allowedNodeEnvironmentFlags() {
    return /* @__PURE__ */ new Set();
  }
  get sourceMapsEnabled() {
    return false;
  }
  get debugPort() {
    return 0;
  }
  get throwDeprecation() {
    return false;
  }
  get traceDeprecation() {
    return false;
  }
  get features() {
    return {};
  }
  get release() {
    return {};
  }
  get connected() {
    return false;
  }
  get config() {
    return {};
  }
  get moduleLoadList() {
    return [];
  }
  constrainedMemory() {
    return 0;
  }
  availableMemory() {
    return 0;
  }
  uptime() {
    return 0;
  }
  resourceUsage() {
    return {};
  }
  ref() {
  }
  unref() {
  }
  umask() {
    throw createNotImplementedError("process.umask");
  }
  getBuiltinModule() {
    return void 0;
  }
  getActiveResourcesInfo() {
    throw createNotImplementedError("process.getActiveResourcesInfo");
  }
  exit() {
    throw createNotImplementedError("process.exit");
  }
  reallyExit() {
    throw createNotImplementedError("process.reallyExit");
  }
  kill() {
    throw createNotImplementedError("process.kill");
  }
  abort() {
    throw createNotImplementedError("process.abort");
  }
  dlopen() {
    throw createNotImplementedError("process.dlopen");
  }
  setSourceMapsEnabled() {
    throw createNotImplementedError("process.setSourceMapsEnabled");
  }
  loadEnvFile() {
    throw createNotImplementedError("process.loadEnvFile");
  }
  disconnect() {
    throw createNotImplementedError("process.disconnect");
  }
  cpuUsage() {
    throw createNotImplementedError("process.cpuUsage");
  }
  setUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.setUncaughtExceptionCaptureCallback");
  }
  hasUncaughtExceptionCaptureCallback() {
    throw createNotImplementedError("process.hasUncaughtExceptionCaptureCallback");
  }
  initgroups() {
    throw createNotImplementedError("process.initgroups");
  }
  openStdin() {
    throw createNotImplementedError("process.openStdin");
  }
  assert() {
    throw createNotImplementedError("process.assert");
  }
  binding() {
    throw createNotImplementedError("process.binding");
  }
  permission = { has: /* @__PURE__ */ notImplemented("process.permission.has") };
  report = {
    directory: "",
    filename: "",
    signal: "SIGUSR2",
    compact: false,
    reportOnFatalError: false,
    reportOnSignal: false,
    reportOnUncaughtException: false,
    getReport: /* @__PURE__ */ notImplemented("process.report.getReport"),
    writeReport: /* @__PURE__ */ notImplemented("process.report.writeReport")
  };
  finalization = {
    register: /* @__PURE__ */ notImplemented("process.finalization.register"),
    unregister: /* @__PURE__ */ notImplemented("process.finalization.unregister"),
    registerBeforeExit: /* @__PURE__ */ notImplemented("process.finalization.registerBeforeExit")
  };
  memoryUsage = Object.assign(() => ({
    arrayBuffers: 0,
    rss: 0,
    external: 0,
    heapTotal: 0,
    heapUsed: 0
  }), { rss: () => 0 });
  mainModule = void 0;
  domain = void 0;
  send = void 0;
  exitCode = void 0;
  channel = void 0;
  getegid = void 0;
  geteuid = void 0;
  getgid = void 0;
  getgroups = void 0;
  getuid = void 0;
  setegid = void 0;
  seteuid = void 0;
  setgid = void 0;
  setgroups = void 0;
  setuid = void 0;
  _events = void 0;
  _eventsCount = void 0;
  _exiting = void 0;
  _maxListeners = void 0;
  _debugEnd = void 0;
  _debugProcess = void 0;
  _fatalException = void 0;
  _getActiveHandles = void 0;
  _getActiveRequests = void 0;
  _kill = void 0;
  _preload_modules = void 0;
  _rawDebug = void 0;
  _startProfilerIdleNotifier = void 0;
  _stopProfilerIdleNotifier = void 0;
  _tickCallback = void 0;
  _disconnect = void 0;
  _handleQueue = void 0;
  _pendingMessage = void 0;
  _channel = void 0;
  _send = void 0;
  _linkedBinding = void 0;
};
__name(Process, "Process");

// node_modules/@cloudflare/unenv-preset/dist/runtime/node/process.mjs
var globalProcess = globalThis["process"];
var getBuiltinModule = globalProcess.getBuiltinModule;
var { exit, platform, nextTick } = getBuiltinModule(
  "node:process"
);
var unenvProcess = new Process({
  env: globalProcess.env,
  hrtime,
  nextTick
});
var {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  finalization,
  features,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  on,
  off,
  once,
  pid,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
} = unenvProcess;
var _process = {
  abort,
  addListener,
  allowedNodeEnvironmentFlags,
  hasUncaughtExceptionCaptureCallback,
  setUncaughtExceptionCaptureCallback,
  loadEnvFile,
  sourceMapsEnabled,
  arch,
  argv,
  argv0,
  chdir,
  config,
  connected,
  constrainedMemory,
  availableMemory,
  cpuUsage,
  cwd,
  debugPort,
  dlopen,
  disconnect,
  emit,
  emitWarning,
  env,
  eventNames,
  execArgv,
  execPath,
  exit,
  finalization,
  features,
  getBuiltinModule,
  getActiveResourcesInfo,
  getMaxListeners,
  hrtime: hrtime3,
  kill,
  listeners,
  listenerCount,
  memoryUsage,
  nextTick,
  on,
  off,
  once,
  pid,
  platform,
  ppid,
  prependListener,
  prependOnceListener,
  rawListeners,
  release,
  removeAllListeners,
  removeListener,
  report,
  resourceUsage,
  setMaxListeners,
  setSourceMapsEnabled,
  stderr,
  stdin,
  stdout,
  title,
  throwDeprecation,
  traceDeprecation,
  umask,
  uptime,
  version,
  versions,
  // @ts-expect-error old API
  domain,
  initgroups,
  moduleLoadList,
  reallyExit,
  openStdin,
  assert: assert2,
  binding,
  send,
  exitCode,
  channel,
  getegid,
  geteuid,
  getgid,
  getgroups,
  getuid,
  setegid,
  seteuid,
  setgid,
  setgroups,
  setuid,
  permission,
  mainModule,
  _events,
  _eventsCount,
  _exiting,
  _maxListeners,
  _debugEnd,
  _debugProcess,
  _fatalException,
  _getActiveHandles,
  _getActiveRequests,
  _kill,
  _preload_modules,
  _rawDebug,
  _startProfilerIdleNotifier,
  _stopProfilerIdleNotifier,
  _tickCallback,
  _disconnect,
  _handleQueue,
  _pendingMessage,
  _channel,
  _send,
  _linkedBinding
};
var process_default = _process;

// node_modules/wrangler/_virtual_unenv_global_polyfill-@cloudflare-unenv-preset-node-process
globalThis.process = process_default;

// ../src/game/deck.ts
var RANKS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
var COPIES_PER_RANK = 3;
var DECK_SIZE = RANKS.length * COPIES_PER_RANK;
function buildDeck() {
  const deck = [];
  for (const rank of RANKS) {
    for (let copy = 0; copy < COPIES_PER_RANK; copy++) {
      deck.push({ id: `r${rank}-${copy}`, rank });
    }
  }
  return deck;
}
__name(buildDeck, "buildDeck");
function mulberry32(seed) {
  let t = seed >>> 0;
  return function() {
    t = t + 1831565813 >>> 0;
    let r = t;
    r = Math.imul(r ^ r >>> 15, r | 1);
    r ^= r + Math.imul(r ^ r >>> 7, r | 61);
    return ((r ^ r >>> 14) >>> 0) / 4294967296;
  };
}
__name(mulberry32, "mulberry32");
function shuffle(items, seed) {
  const rand = mulberry32(seed);
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
__name(shuffle, "shuffle");
function deal(deck, playerCount) {
  if (deck.length !== DECK_SIZE) {
    throw new Error(`Deck must be ${DECK_SIZE} cards, got ${deck.length}`);
  }
  const perPlayer = DECK_SIZE / playerCount;
  const hands = Array.from({ length: playerCount }, () => []);
  for (let i = 0; i < deck.length; i++) {
    hands[i % playerCount].push(deck[i]);
  }
  for (const hand of hands) {
    hand.sort((a, b) => a.rank - b.rank);
  }
  return hands;
}
__name(deal, "deal");

// ../src/game/rules.ts
var POINTS_TO_WIN = 4;
function createInitialState(input) {
  const { playerCount, playerNames, teamAssignments, startingPlayerIndex } = input;
  if (playerNames.length !== playerCount) {
    throw new Error("playerNames length must equal playerCount");
  }
  if (teamAssignments.length !== playerCount) {
    throw new Error("teamAssignments length must equal playerCount");
  }
  const teamIds = Array.from(new Set(teamAssignments));
  const expectedTeamCount = playerCount / 2;
  if (teamIds.length !== expectedTeamCount) {
    throw new Error(`Expected ${expectedTeamCount} teams, got ${teamIds.length}`);
  }
  for (const tid of teamIds) {
    const size = teamAssignments.filter((t) => t === tid).length;
    if (size !== 2)
      throw new Error(`Team ${tid} must have exactly 2 players`);
  }
  const seed = input.seed ?? (Date.now() ^ Math.random() * 4294967295) >>> 0;
  const deck = shuffle(buildDeck(), seed);
  const hands = deal(deck, playerCount);
  const seating = buildSeating(teamAssignments);
  const providedIds = input.playerIds;
  const players = seating.map((playerIdx, seatIndex) => ({
    id: providedIds ? providedIds[playerIdx] : `p${playerIdx}`,
    name: playerNames[playerIdx],
    teamId: teamAssignments[playerIdx],
    seatIndex,
    hand: hands[seatIndex]
  }));
  const teams = teamIds.map((id, i) => ({
    id,
    name: `Team ${String.fromCharCode(65 + i)}`,
    playerIds: players.filter((p) => p.teamId === id).map((p) => p.id),
    points: 0
  }));
  const turnOrder = [];
  for (let i = 0; i < playerCount; i++) {
    const seat = (startingPlayerIndex - i + playerCount) % playerCount;
    turnOrder.push(players[seat].id);
  }
  return {
    phase: "initialSwap",
    players,
    teams,
    turnOrder,
    activePlayerIndex: 0,
    discard: [],
    currentReveals: [],
    lastTurnMessage: null,
    winningTeamId: null,
    pendingSwapTeamIds: teamIds.slice(),
    swapChoices: {},
    scoringTeamId: null,
    pointsToWin: POINTS_TO_WIN,
    seed
  };
}
__name(createInitialState, "createInitialState");
function buildSeating(teamAssignments) {
  const teamIds = Array.from(new Set(teamAssignments));
  const byTeam = {};
  for (const tid of teamIds)
    byTeam[tid] = [];
  teamAssignments.forEach((tid, idx) => byTeam[tid].push(idx));
  const seats = [];
  const cursors = {};
  for (const tid of teamIds)
    cursors[tid] = 0;
  for (let i = 0; i < teamAssignments.length; i++) {
    const tid = teamIds[i % teamIds.length];
    seats.push(byTeam[tid][cursors[tid]++]);
  }
  return seats;
}
__name(buildSeating, "buildSeating");
function smallestOf(hand) {
  if (hand.length === 0)
    return null;
  let best = hand[0];
  for (const c of hand)
    if (c.rank < best.rank)
      best = c;
  return best;
}
__name(smallestOf, "smallestOf");
function largestOf(hand) {
  if (hand.length === 0)
    return null;
  let best = hand[0];
  for (const c of hand)
    if (c.rank > best.rank)
      best = c;
  return best;
}
__name(largestOf, "largestOf");
function pickCard(hand, which) {
  return which === "smallest" ? smallestOf(hand) : largestOf(hand);
}
__name(pickCard, "pickCard");
function activePlayer(state) {
  const id = state.turnOrder[state.activePlayerIndex];
  const p = state.players.find((pl) => pl.id === id);
  if (!p)
    throw new Error("Active player missing");
  return p;
}
__name(activePlayer, "activePlayer");
function findPlayer(state, playerId) {
  const p = state.players.find((pl) => pl.id === playerId);
  if (!p)
    throw new Error(`Player ${playerId} not found`);
  return p;
}
__name(findPlayer, "findPlayer");
function findTeam(state, teamId) {
  const t = state.teams.find((tm) => tm.id === teamId);
  if (!t)
    throw new Error(`Team ${teamId} not found`);
  return t;
}
__name(findTeam, "findTeam");
function submitSwapChoice(state, playerId, choice) {
  if (state.phase !== "initialSwap" && state.phase !== "postScoreSwap") {
    throw new Error("Not in a swap phase");
  }
  const player = findPlayer(state, playerId);
  const teamId = player.teamId;
  if (!state.pendingSwapTeamIds.includes(teamId)) {
    throw new Error(`Team ${teamId} is not pending a swap`);
  }
  if (choice.cardId) {
    const owns = player.hand.some((c) => c.id === choice.cardId);
    if (!owns)
      throw new Error("Card not in player hand");
  }
  const teamChoices = { ...state.swapChoices[teamId] ?? {} };
  teamChoices[playerId] = choice;
  const swapChoices = { ...state.swapChoices, [teamId]: teamChoices };
  let next = { ...state, swapChoices };
  const team = findTeam(state, teamId);
  const [aId, bId] = team.playerIds;
  const aChoice = teamChoices[aId];
  const bChoice = teamChoices[bId];
  if (aChoice && bChoice) {
    next = resolveTeamSwap(next, teamId);
  }
  if (next.pendingSwapTeamIds.length === 0) {
    const wasInitial = state.phase === "initialSwap";
    next = {
      ...next,
      swapChoices: {},
      phase: wasInitial ? "turnStart" : "turnStart",
      scoringTeamId: null
    };
  }
  return next;
}
__name(submitSwapChoice, "submitSwapChoice");
function resolveTeamSwap(state, teamId) {
  const team = findTeam(state, teamId);
  const [aId, bId] = team.playerIds;
  const teamChoices = state.swapChoices[teamId] ?? {};
  const aChoice = teamChoices[aId];
  const bChoice = teamChoices[bId];
  const pending = state.pendingSwapTeamIds.filter((t) => t !== teamId);
  if (!aChoice?.cardId || !bChoice?.cardId || aChoice.skip || bChoice.skip) {
    return { ...state, pendingSwapTeamIds: pending };
  }
  const a = findPlayer(state, aId);
  const b = findPlayer(state, bId);
  const cardA = a.hand.find((c) => c.id === aChoice.cardId);
  const cardB = b.hand.find((c) => c.id === bChoice.cardId);
  const players = state.players.map((p) => {
    if (p.id === aId) {
      return { ...p, hand: sortHand([...p.hand.filter((c) => c.id !== cardA.id), cardB]) };
    }
    if (p.id === bId) {
      return { ...p, hand: sortHand([...p.hand.filter((c) => c.id !== cardB.id), cardA]) };
    }
    return p;
  });
  return { ...state, players, pendingSwapTeamIds: pending };
}
__name(resolveTeamSwap, "resolveTeamSwap");
function beginTurn(state) {
  if (state.phase !== "turnStart")
    throw new Error("Not in turn start phase");
  return { ...state, phase: "guess1", currentReveals: [], lastTurnMessage: null };
}
__name(beginTurn, "beginTurn");
function makeGuess(state, targetPlayerId, which) {
  if (state.phase !== "guess1" && state.phase !== "guess2" && state.phase !== "guess3") {
    throw new Error("Not in a guess phase");
  }
  const target = findPlayer(state, targetPlayerId);
  const card = pickCard(target.hand, which);
  if (!card) {
    return failTurn(state, `${target.name} has no cards.`);
  }
  const stateMinusCard = updatePlayers(
    state,
    (p) => p.id === target.id ? { ...p, hand: p.hand.filter((c) => c.id !== card.id) } : p
  );
  const reveal = { card, fromPlayerId: target.id, which };
  const reveals = [...state.currentReveals, reveal];
  if (state.phase === "guess1") {
    return { ...stateMinusCard, currentReveals: reveals, phase: "guess2" };
  }
  const prev = reveals[reveals.length - 2];
  if (prev.card.rank !== reveal.card.rank) {
    const returned = returnRevealedCards({ ...stateMinusCard, currentReveals: reveals });
    return endTurn(returned, `Mismatch at guess ${reveals.length}. Turn passes.`);
  }
  if (state.phase === "guess2") {
    return { ...stateMinusCard, currentReveals: reveals, phase: "guess3" };
  }
  return scorePoint({ ...stateMinusCard, currentReveals: reveals });
}
__name(makeGuess, "makeGuess");
function failTurn(state, message) {
  const returned = returnRevealedCards(state);
  return endTurn(returned, message);
}
__name(failTurn, "failTurn");
function returnRevealedCards(state) {
  if (state.currentReveals.length === 0)
    return state;
  return updatePlayers(
    { ...state, currentReveals: [] },
    (p) => {
      const back = state.currentReveals.filter((r) => r.fromPlayerId === p.id).map((r) => r.card);
      if (back.length === 0)
        return p;
      return { ...p, hand: sortHand([...p.hand, ...back]) };
    }
  );
}
__name(returnRevealedCards, "returnRevealedCards");
function scorePoint(state) {
  const active = activePlayer(state);
  const team = findTeam(state, active.teamId);
  const discardAdds = state.currentReveals.map((r) => r.card);
  const newTeams = state.teams.map(
    (t) => t.id === team.id ? { ...t, points: t.points + 1 } : t
  );
  const winning = newTeams.find((t) => t.points >= state.pointsToWin);
  const base = {
    ...state,
    teams: newTeams,
    discard: sortHand([...state.discard, ...discardAdds]),
    currentReveals: [],
    lastTurnMessage: `${team.name} scored! (${team.points + 1}/${state.pointsToWin})`
  };
  if (winning) {
    return { ...base, phase: "victory", winningTeamId: winning.id };
  }
  const otherTeams = state.teams.filter((t) => t.id !== team.id).map((t) => t.id);
  return {
    ...base,
    phase: otherTeams.length > 0 ? "postScoreSwap" : "turnStart",
    pendingSwapTeamIds: otherTeams,
    swapChoices: {},
    scoringTeamId: team.id,
    activePlayerIndex: advanceIndex(state)
  };
}
__name(scorePoint, "scorePoint");
function endTurn(state, message) {
  return {
    ...state,
    phase: "turnStart",
    activePlayerIndex: advanceIndex(state),
    currentReveals: [],
    lastTurnMessage: message
  };
}
__name(endTurn, "endTurn");
function advanceIndex(state) {
  return (state.activePlayerIndex + 1) % state.turnOrder.length;
}
__name(advanceIndex, "advanceIndex");
function updatePlayers(state, fn) {
  return { ...state, players: state.players.map(fn) };
}
__name(updatePlayers, "updatePlayers");
function sortHand(cards) {
  return cards.slice().sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
}
__name(sortHand, "sortHand");
function projectStateForPlayer(state, viewerId) {
  const players = state.players.map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    seatIndex: p.seatIndex,
    handCount: p.hand.length,
    hand: p.id === viewerId ? p.hand : void 0
  }));
  const activePlayerId = state.turnOrder[state.activePlayerIndex];
  return {
    phase: state.phase,
    players,
    teams: state.teams,
    turnOrder: state.turnOrder,
    activePlayerIndex: state.activePlayerIndex,
    activePlayerId,
    discard: state.discard,
    currentReveals: state.currentReveals,
    lastTurnMessage: state.lastTurnMessage,
    winningTeamId: state.winningTeamId,
    pendingSwapTeamIds: state.pendingSwapTeamIds,
    swapChoices: state.swapChoices,
    scoringTeamId: state.scoringTeamId,
    pointsToWin: state.pointsToWin,
    viewerId
  };
}
__name(projectStateForPlayer, "projectStateForPlayer");

// ../src/game/room.ts
function emptyRoom(code, playerCount) {
  return {
    code,
    phase: "lobby",
    playerCount,
    hostSessionId: null,
    members: [],
    game: null
  };
}
__name(emptyRoom, "emptyRoom");
function lobbyMessage(room) {
  return {
    code: room.code,
    playerCount: room.playerCount,
    hostId: room.hostSessionId ?? "",
    players: room.members.map((m) => ({
      id: m.playerId,
      name: m.name,
      connected: m.connected,
      isHost: m.sessionId === room.hostSessionId
    }))
  };
}
__name(lobbyMessage, "lobbyMessage");
function personalMessages(room) {
  const lobby = lobbyMessage(room);
  if (room.phase === "lobby") {
    return room.members.map((m) => ({
      sessionId: m.sessionId,
      msg: { t: "lobby", lobby, you: { playerId: m.playerId } }
    }));
  }
  if (room.phase === "playing" && room.game) {
    const game = room.game;
    return room.members.map((m) => ({
      sessionId: m.sessionId,
      msg: { t: "game", lobby, state: projectStateForPlayer(game, m.playerId) }
    }));
  }
  return [];
}
__name(personalMessages, "personalMessages");
function personalizedBroadcasts(room) {
  return personalMessages(room);
}
__name(personalizedBroadcasts, "personalizedBroadcasts");
function genPlayerId(existing) {
  let i = 0;
  while (existing.includes(`p${i}`))
    i++;
  return `p${i}`;
}
__name(genPlayerId, "genPlayerId");
function handleCreate(room, sessionId, name, playerCount) {
  if (room.members.length > 0)
    throw new Error("Room already created");
  const playerId = genPlayerId([]);
  return {
    ...room,
    playerCount,
    hostSessionId: sessionId,
    members: [{ sessionId, playerId, name, connected: true }]
  };
}
__name(handleCreate, "handleCreate");
function handleJoin(room, sessionId, name) {
  const existing = room.members.find((m) => m.sessionId === sessionId);
  if (existing) {
    return {
      ...room,
      members: room.members.map(
        (m) => m.sessionId === sessionId ? { ...m, connected: true, name: name || m.name } : m
      )
    };
  }
  if (room.phase !== "lobby") {
    throw new Error("Game already started; cannot join.");
  }
  if (room.members.length >= room.playerCount) {
    throw new Error("Room is full.");
  }
  const playerId = genPlayerId(room.members.map((m) => m.playerId));
  const hostSessionId = room.hostSessionId ?? sessionId;
  return {
    ...room,
    hostSessionId,
    members: [...room.members, { sessionId, playerId, name, connected: true }]
  };
}
__name(handleJoin, "handleJoin");
function handleDisconnect(room, sessionId) {
  const member = room.members.find((m) => m.sessionId === sessionId);
  if (!member)
    return room;
  if (room.phase === "lobby") {
    const members = room.members.filter((m) => m.sessionId !== sessionId);
    let hostSessionId = room.hostSessionId;
    if (hostSessionId === sessionId) {
      hostSessionId = members[0]?.sessionId ?? null;
    }
    return { ...room, members, hostSessionId };
  }
  return {
    ...room,
    members: room.members.map(
      (m) => m.sessionId === sessionId ? { ...m, connected: false } : m
    )
  };
}
__name(handleDisconnect, "handleDisconnect");
function handleLeave(room, sessionId) {
  const member = room.members.find((m) => m.sessionId === sessionId);
  if (!member)
    return room;
  if (room.phase === "lobby") {
    return handleDisconnect(room, sessionId);
  }
  return { ...room, phase: "ended" };
}
__name(handleLeave, "handleLeave");
function canStart(room) {
  return room.phase === "lobby" && room.members.length === room.playerCount && room.members.every((m) => m.connected);
}
__name(canStart, "canStart");
function handleStartGame(room, sessionId, seedOverride) {
  if (sessionId !== room.hostSessionId) {
    throw new Error("Only the host can start the game.");
  }
  if (!canStart(room)) {
    throw new Error("Not enough players yet.");
  }
  const n = room.playerCount;
  const names = room.members.map((m) => m.name);
  const ids = room.members.map((m) => m.playerId);
  const teamAssignments = n === 4 ? ["T1", "T2", "T1", "T2"] : ["T1", "T2", "T3", "T1", "T2", "T3"];
  const startingPlayerIndex = Math.floor(Math.random() * n);
  const game = createInitialState({
    playerCount: n,
    playerNames: names,
    teamAssignments,
    startingPlayerIndex,
    seed: seedOverride,
    playerIds: ids
  });
  return { ...room, phase: "playing", game, lastSeed: game.seed };
}
__name(handleStartGame, "handleStartGame");
function memberBySession(room, sessionId) {
  const m = room.members.find((mm) => mm.sessionId === sessionId);
  if (!m)
    throw new Error("Not in this room.");
  return m;
}
__name(memberBySession, "memberBySession");
function handleSwapChoice(room, sessionId, choice) {
  if (room.phase !== "playing" || !room.game)
    throw new Error("No game in progress.");
  const member = memberBySession(room, sessionId);
  const game = submitSwapChoice(room.game, member.playerId, choice);
  return { ...room, game };
}
__name(handleSwapChoice, "handleSwapChoice");
function handleBeginTurn(room, sessionId) {
  if (room.phase !== "playing" || !room.game)
    throw new Error("No game in progress.");
  const member = memberBySession(room, sessionId);
  const activeId = room.game.turnOrder[room.game.activePlayerIndex];
  if (member.playerId !== activeId)
    throw new Error("Not your turn.");
  return { ...room, game: beginTurn(room.game) };
}
__name(handleBeginTurn, "handleBeginTurn");
function handleGuess(room, sessionId, targetPlayerId, which) {
  if (room.phase !== "playing" || !room.game)
    throw new Error("No game in progress.");
  const member = memberBySession(room, sessionId);
  const activeId = room.game.turnOrder[room.game.activePlayerIndex];
  if (member.playerId !== activeId)
    throw new Error("Not your turn.");
  return { ...room, game: makeGuess(room.game, targetPlayerId, which) };
}
__name(handleGuess, "handleGuess");
function handlePlayAgain(room, sessionId) {
  if (sessionId !== room.hostSessionId)
    throw new Error("Only host can restart.");
  return { ...room, phase: "lobby", game: null };
}
__name(handlePlayAgain, "handlePlayAgain");

// src/GameRoom.ts
var STORAGE_KEY = "room";
var ROOM_IDLE_TIMEOUT_MS = 1e3 * 60 * 30;
var GameRoom = class {
  state;
  env;
  room = null;
  loaded = false;
  constructor(state, env2) {
    this.state = state;
    this.env = env2;
  }
  async load(code, playerCount = 4) {
    if (this.room && this.loaded)
      return this.room;
    const saved = await this.state.storage.get(STORAGE_KEY);
    this.room = saved ?? emptyRoom(code, playerCount);
    this.loaded = true;
    return this.room;
  }
  async save() {
    if (!this.room)
      return;
    await this.state.storage.put(STORAGE_KEY, this.room);
  }
  async fetch(request) {
    const url = new URL(request.url);
    const code = url.pathname.slice("/ws/".length).toUpperCase();
    const upgrade = request.headers.get("Upgrade")?.toLowerCase();
    if (upgrade !== "websocket") {
      return new Response("Expected WebSocket upgrade", { status: 426 });
    }
    await this.load(code);
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const sessionId = url.searchParams.get("sid") || (globalThis.crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 10));
    const name = (url.searchParams.get("name") ?? "").slice(0, 24) || "Player";
    const attach = { sessionId, name };
    server.serializeAttachment(attach);
    this.state.acceptWebSocket(server);
    this.send(server, { t: "welcome", sessionId });
    await this.syncAll();
    return new Response(null, { status: 101, webSocket: client });
  }
  async webSocketMessage(ws, message) {
    await this.load("");
    const attach = ws.deserializeAttachment();
    if (!attach)
      return;
    let msg;
    try {
      msg = JSON.parse(typeof message === "string" ? message : new TextDecoder().decode(message));
    } catch {
      return this.send(ws, { t: "error", code: "bad_json", message: "Invalid JSON" });
    }
    try {
      await this.applyMessage(ws, attach, msg);
    } catch (e) {
      this.send(ws, {
        t: "error",
        code: "bad_action",
        message: e.message ?? String(e)
      });
    }
    await this.save();
    await this.syncAll();
  }
  async webSocketClose(ws) {
    await this.load("");
    const attach = ws.deserializeAttachment();
    if (!attach || !this.room)
      return;
    this.room = handleDisconnect(this.room, attach.sessionId);
    if (this.room.phase === "lobby" && this.room.members.length === 0) {
      await this.state.storage.deleteAll();
      this.room = null;
      return;
    }
    await this.save();
    await this.syncAll();
  }
  async webSocketError(ws) {
    return this.webSocketClose(ws);
  }
  async alarm() {
    await this.load("");
    if (this.room && this.room.members.length === 0) {
      await this.state.storage.deleteAll();
      this.room = null;
    }
  }
  async applyMessage(ws, attach, msg) {
    if (!this.room)
      return;
    if (msg.t === "hello") {
      if (msg.name && msg.name.length <= 24) {
        attach.name = msg.name;
        ws.serializeAttachment(attach);
      }
      return;
    }
    switch (msg.t) {
      case "create": {
        if (this.room.members.length > 0) {
          const existing = this.room.members.find((m) => m.sessionId === attach.sessionId);
          if (existing)
            return;
          throw new Error("Room already exists. Use join instead.");
        }
        this.room = handleCreate(emptyRoom(this.room.code, msg.playerCount), attach.sessionId, attach.name, msg.playerCount);
        await this.state.storage.setAlarm(Date.now() + ROOM_IDLE_TIMEOUT_MS);
        break;
      }
      case "join":
        if (this.room.members.length === 0) {
          throw new Error("Room not found. Ask the host for a valid code.");
        }
        this.room = handleJoin(this.room, attach.sessionId, attach.name);
        break;
      case "leave":
        this.room = handleLeave(this.room, attach.sessionId);
        break;
      case "startGame":
        this.room = handleStartGame(this.room, attach.sessionId);
        break;
      case "swapChoice":
        this.room = handleSwapChoice(this.room, attach.sessionId, {
          cardId: msg.cardId,
          skip: msg.skip
        });
        break;
      case "beginTurn":
        this.room = handleBeginTurn(this.room, attach.sessionId);
        break;
      case "guess":
        this.room = handleGuess(this.room, attach.sessionId, msg.targetPlayerId, msg.which);
        break;
      case "playAgain":
        this.room = handlePlayAgain(this.room, attach.sessionId);
        break;
    }
  }
  send(ws, msg) {
    try {
      ws.send(JSON.stringify(msg));
    } catch {
    }
  }
  async syncAll() {
    if (!this.room) {
      for (const ws of this.state.getWebSockets()) {
        this.send(ws, { t: "abandoned", reason: "Room closed." });
      }
      return;
    }
    if (this.room.phase === "ended") {
      for (const ws of this.state.getWebSockets()) {
        this.send(ws, { t: "abandoned", reason: "A player left the game." });
      }
      return;
    }
    const bySession = new Map(
      personalizedBroadcasts(this.room).map((b) => [b.sessionId, b.msg])
    );
    const sockets = this.state.getWebSockets();
    console.log(`[GameRoom] syncAll phase=${this.room.phase} members=${this.room.members.length} sockets=${sockets.length} bySession=${bySession.size}`);
    for (const ws of sockets) {
      const attach = ws.deserializeAttachment();
      if (!attach) {
        console.log("[GameRoom] ws missing attach");
        continue;
      }
      const msg = bySession.get(attach.sessionId);
      console.log(`[GameRoom] -> ${attach.name}(${attach.sessionId.slice(0, 6)}) msg=${msg?.t ?? "NONE"}`);
      if (msg)
        this.send(ws, msg);
    }
  }
};
__name(GameRoom, "GameRoom");

// src/worker.ts
function corsHeaders(env2) {
  return {
    "Access-Control-Allow-Origin": env2.ALLOWED_ORIGIN || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "content-type",
    "Access-Control-Max-Age": "86400"
  };
}
__name(corsHeaders, "corsHeaders");
function generateRoomCode() {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const buf = crypto.getRandomValues(new Uint8Array(4));
  for (let i = 0; i < 4; i++)
    code += alpha[buf[i] % alpha.length];
  return code;
}
__name(generateRoomCode, "generateRoomCode");
var worker_default = {
  async fetch(request, env2) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(env2) });
    }
    if (url.pathname === "/health") {
      return new Response("ok", { headers: corsHeaders(env2) });
    }
    if (url.pathname === "/new" && request.method === "POST") {
      const code = generateRoomCode();
      return new Response(JSON.stringify({ code }), {
        headers: { "content-type": "application/json", ...corsHeaders(env2) }
      });
    }
    if (url.pathname.startsWith("/ws/")) {
      const code = url.pathname.slice("/ws/".length).toUpperCase();
      if (!/^[A-Z0-9]{4,8}$/.test(code)) {
        return new Response("Bad room code", { status: 400, headers: corsHeaders(env2) });
      }
      const id = env2.GAME_ROOM.idFromName(code);
      const stub = env2.GAME_ROOM.get(id);
      return stub.fetch(request);
    }
    return new Response("Three Musketeers server is up.", {
      headers: { ...corsHeaders(env2), "content-type": "text/plain" }
    });
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env2, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env2);
  } catch (e) {
    const error3 = reduceError(e);
    return Response.json(error3, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-yNNZJX/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = worker_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env2, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env2, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env2, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env2, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-yNNZJX/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env2, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env2, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env2, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env2, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env2, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env2, ctx) => {
      this.env = env2;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  GameRoom,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=worker.js.map
