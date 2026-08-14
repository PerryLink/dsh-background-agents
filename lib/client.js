window.__ModuleLoader__.load({
	id: "dsh-background-agents",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		//#endregion
		let react = require("react");
		let react_dom = require("react-dom");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/util.cjs
		var require_util = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.getParsedType = exports.ZodParsedType = exports.objectUtil = exports.util = void 0;
			var util;
			(function(util) {
				util.assertEqual = (_) => {};
				function assertIs(_arg) {}
				util.assertIs = assertIs;
				function assertNever(_x) {
					throw new Error();
				}
				util.assertNever = assertNever;
				util.arrayToEnum = (items) => {
					const obj = {};
					for (const item of items) obj[item] = item;
					return obj;
				};
				util.getValidEnumValues = (obj) => {
					const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
					const filtered = {};
					for (const k of validKeys) filtered[k] = obj[k];
					return util.objectValues(filtered);
				};
				util.objectValues = (obj) => {
					return util.objectKeys(obj).map(function(e) {
						return obj[e];
					});
				};
				util.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
					const keys = [];
					for (const key in object) if (Object.prototype.hasOwnProperty.call(object, key)) keys.push(key);
					return keys;
				};
				util.find = (arr, checker) => {
					for (const item of arr) if (checker(item)) return item;
				};
				util.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
				function joinValues(array, separator = " | ") {
					return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
				}
				util.joinValues = joinValues;
				util.jsonStringifyReplacer = (_, value) => {
					if (typeof value === "bigint") return value.toString();
					return value;
				};
			})(util || (exports.util = util = {}));
			var objectUtil;
			(function(objectUtil) {
				objectUtil.mergeShapes = (first, second) => {
					return {
						...first,
						...second
					};
				};
			})(objectUtil || (exports.objectUtil = objectUtil = {}));
			exports.ZodParsedType = util.arrayToEnum([
				"string",
				"nan",
				"number",
				"integer",
				"float",
				"boolean",
				"date",
				"bigint",
				"symbol",
				"function",
				"undefined",
				"null",
				"array",
				"object",
				"unknown",
				"promise",
				"void",
				"never",
				"map",
				"set"
			]);
			const getParsedType = (data) => {
				switch (typeof data) {
					case "undefined": return exports.ZodParsedType.undefined;
					case "string": return exports.ZodParsedType.string;
					case "number": return Number.isNaN(data) ? exports.ZodParsedType.nan : exports.ZodParsedType.number;
					case "boolean": return exports.ZodParsedType.boolean;
					case "function": return exports.ZodParsedType.function;
					case "bigint": return exports.ZodParsedType.bigint;
					case "symbol": return exports.ZodParsedType.symbol;
					case "object":
						if (Array.isArray(data)) return exports.ZodParsedType.array;
						if (data === null) return exports.ZodParsedType.null;
						if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") return exports.ZodParsedType.promise;
						if (typeof Map !== "undefined" && data instanceof Map) return exports.ZodParsedType.map;
						if (typeof Set !== "undefined" && data instanceof Set) return exports.ZodParsedType.set;
						if (typeof Date !== "undefined" && data instanceof Date) return exports.ZodParsedType.date;
						return exports.ZodParsedType.object;
					default: return exports.ZodParsedType.unknown;
				}
			};
			exports.getParsedType = getParsedType;
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/ZodError.cjs
		var require_ZodError = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.ZodError = exports.quotelessJson = exports.ZodIssueCode = void 0;
			const util_js_1 = require_util();
			exports.ZodIssueCode = util_js_1.util.arrayToEnum([
				"invalid_type",
				"invalid_literal",
				"custom",
				"invalid_union",
				"invalid_union_discriminator",
				"invalid_enum_value",
				"unrecognized_keys",
				"invalid_arguments",
				"invalid_return_type",
				"invalid_date",
				"invalid_string",
				"too_small",
				"too_big",
				"invalid_intersection_types",
				"not_multiple_of",
				"not_finite"
			]);
			const quotelessJson = (obj) => {
				return JSON.stringify(obj, null, 2).replace(/"([^"]+)":/g, "$1:");
			};
			exports.quotelessJson = quotelessJson;
			var ZodError = class ZodError extends Error {
				get errors() {
					return this.issues;
				}
				constructor(issues) {
					super();
					this.issues = [];
					this.addIssue = (sub) => {
						this.issues = [...this.issues, sub];
					};
					this.addIssues = (subs = []) => {
						this.issues = [...this.issues, ...subs];
					};
					const actualProto = new.target.prototype;
					if (Object.setPrototypeOf) Object.setPrototypeOf(this, actualProto);
					else this.__proto__ = actualProto;
					this.name = "ZodError";
					this.issues = issues;
				}
				format(_mapper) {
					const mapper = _mapper || function(issue) {
						return issue.message;
					};
					const fieldErrors = { _errors: [] };
					const processError = (error) => {
						for (const issue of error.issues) if (issue.code === "invalid_union") issue.unionErrors.map(processError);
						else if (issue.code === "invalid_return_type") processError(issue.returnTypeError);
						else if (issue.code === "invalid_arguments") processError(issue.argumentsError);
						else if (issue.path.length === 0) fieldErrors._errors.push(mapper(issue));
						else {
							let curr = fieldErrors;
							let i = 0;
							while (i < issue.path.length) {
								const el = issue.path[i];
								if (!(i === issue.path.length - 1)) curr[el] = curr[el] || { _errors: [] };
								else {
									curr[el] = curr[el] || { _errors: [] };
									curr[el]._errors.push(mapper(issue));
								}
								curr = curr[el];
								i++;
							}
						}
					};
					processError(this);
					return fieldErrors;
				}
				static assert(value) {
					if (!(value instanceof ZodError)) throw new Error(`Not a ZodError: ${value}`);
				}
				toString() {
					return this.message;
				}
				get message() {
					return JSON.stringify(this.issues, util_js_1.util.jsonStringifyReplacer, 2);
				}
				get isEmpty() {
					return this.issues.length === 0;
				}
				flatten(mapper = (issue) => issue.message) {
					const fieldErrors = {};
					const formErrors = [];
					for (const sub of this.issues) if (sub.path.length > 0) {
						const firstEl = sub.path[0];
						fieldErrors[firstEl] = fieldErrors[firstEl] || [];
						fieldErrors[firstEl].push(mapper(sub));
					} else formErrors.push(mapper(sub));
					return {
						formErrors,
						fieldErrors
					};
				}
				get formErrors() {
					return this.flatten();
				}
			};
			exports.ZodError = ZodError;
			ZodError.create = (issues) => {
				return new ZodError(issues);
			};
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/locales/en.cjs
		var require_en = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
			const ZodError_js_1 = require_ZodError();
			const util_js_1 = require_util();
			const errorMap = (issue, _ctx) => {
				let message;
				switch (issue.code) {
					case ZodError_js_1.ZodIssueCode.invalid_type:
						if (issue.received === util_js_1.ZodParsedType.undefined) message = "Required";
						else message = `Expected ${issue.expected}, received ${issue.received}`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_literal:
						message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util_js_1.util.jsonStringifyReplacer)}`;
						break;
					case ZodError_js_1.ZodIssueCode.unrecognized_keys:
						message = `Unrecognized key(s) in object: ${util_js_1.util.joinValues(issue.keys, ", ")}`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_union:
						message = `Invalid input`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_union_discriminator:
						message = `Invalid discriminator value. Expected ${util_js_1.util.joinValues(issue.options)}`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_enum_value:
						message = `Invalid enum value. Expected ${util_js_1.util.joinValues(issue.options)}, received '${issue.received}'`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_arguments:
						message = `Invalid function arguments`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_return_type:
						message = `Invalid function return type`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_date:
						message = `Invalid date`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_string:
						if (typeof issue.validation === "object") {
							if ("includes" in issue.validation) {
								message = `Invalid input: must include "${issue.validation.includes}"`;
								if (typeof issue.validation.position === "number") message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
							} else if ("startsWith" in issue.validation) message = `Invalid input: must start with "${issue.validation.startsWith}"`;
							else if ("endsWith" in issue.validation) message = `Invalid input: must end with "${issue.validation.endsWith}"`;
							else util_js_1.util.assertNever(issue.validation);
						} else if (issue.validation !== "regex") message = `Invalid ${issue.validation}`;
						else message = "Invalid";
						break;
					case ZodError_js_1.ZodIssueCode.too_small:
						if (issue.type === "array") message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
						else if (issue.type === "string") message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
						else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
						else if (issue.type === "bigint") message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
						else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
						else message = "Invalid input";
						break;
					case ZodError_js_1.ZodIssueCode.too_big:
						if (issue.type === "array") message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
						else if (issue.type === "string") message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
						else if (issue.type === "number") message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
						else if (issue.type === "bigint") message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
						else if (issue.type === "date") message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
						else message = "Invalid input";
						break;
					case ZodError_js_1.ZodIssueCode.custom:
						message = `Invalid input`;
						break;
					case ZodError_js_1.ZodIssueCode.invalid_intersection_types:
						message = `Intersection results could not be merged`;
						break;
					case ZodError_js_1.ZodIssueCode.not_multiple_of:
						message = `Number must be a multiple of ${issue.multipleOf}`;
						break;
					case ZodError_js_1.ZodIssueCode.not_finite:
						message = "Number must be finite";
						break;
					default:
						message = _ctx.defaultError;
						util_js_1.util.assertNever(issue);
				}
				return { message };
			};
			exports.default = errorMap;
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/errors.cjs
		var require_errors = /* @__PURE__ */ __commonJSMin(((exports) => {
			var __importDefault = exports && exports.__importDefault || function(mod) {
				return mod && mod.__esModule ? mod : { "default": mod };
			};
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.defaultErrorMap = void 0;
			exports.setErrorMap = setErrorMap;
			exports.getErrorMap = getErrorMap;
			const en_js_1 = __importDefault(require_en());
			exports.defaultErrorMap = en_js_1.default;
			let overrideErrorMap = en_js_1.default;
			function setErrorMap(map) {
				overrideErrorMap = map;
			}
			function getErrorMap() {
				return overrideErrorMap;
			}
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/parseUtil.cjs
		var require_parseUtil = /* @__PURE__ */ __commonJSMin(((exports) => {
			var __importDefault = exports && exports.__importDefault || function(mod) {
				return mod && mod.__esModule ? mod : { "default": mod };
			};
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.isAsync = exports.isValid = exports.isDirty = exports.isAborted = exports.OK = exports.DIRTY = exports.INVALID = exports.ParseStatus = exports.EMPTY_PATH = exports.makeIssue = void 0;
			exports.addIssueToContext = addIssueToContext;
			const errors_js_1 = require_errors();
			const en_js_1 = __importDefault(require_en());
			const makeIssue = (params) => {
				const { data, path, errorMaps, issueData } = params;
				const fullPath = [...path, ...issueData.path || []];
				const fullIssue = {
					...issueData,
					path: fullPath
				};
				if (issueData.message !== void 0) return {
					...issueData,
					path: fullPath,
					message: issueData.message
				};
				let errorMessage = "";
				const maps = errorMaps.filter((m) => !!m).slice().reverse();
				for (const map of maps) errorMessage = map(fullIssue, {
					data,
					defaultError: errorMessage
				}).message;
				return {
					...issueData,
					path: fullPath,
					message: errorMessage
				};
			};
			exports.makeIssue = makeIssue;
			exports.EMPTY_PATH = [];
			function addIssueToContext(ctx, issueData) {
				const overrideMap = (0, errors_js_1.getErrorMap)();
				const issue = (0, exports.makeIssue)({
					issueData,
					data: ctx.data,
					path: ctx.path,
					errorMaps: [
						ctx.common.contextualErrorMap,
						ctx.schemaErrorMap,
						overrideMap,
						overrideMap === en_js_1.default ? void 0 : en_js_1.default
					].filter((x) => !!x)
				});
				ctx.common.issues.push(issue);
			}
			exports.ParseStatus = class ParseStatus {
				constructor() {
					this.value = "valid";
				}
				dirty() {
					if (this.value === "valid") this.value = "dirty";
				}
				abort() {
					if (this.value !== "aborted") this.value = "aborted";
				}
				static mergeArray(status, results) {
					const arrayValue = [];
					for (const s of results) {
						if (s.status === "aborted") return exports.INVALID;
						if (s.status === "dirty") status.dirty();
						arrayValue.push(s.value);
					}
					return {
						status: status.value,
						value: arrayValue
					};
				}
				static async mergeObjectAsync(status, pairs) {
					const syncPairs = [];
					for (const pair of pairs) {
						const key = await pair.key;
						const value = await pair.value;
						syncPairs.push({
							key,
							value
						});
					}
					return ParseStatus.mergeObjectSync(status, syncPairs);
				}
				static mergeObjectSync(status, pairs) {
					const finalObject = {};
					for (const pair of pairs) {
						const { key, value } = pair;
						if (key.status === "aborted") return exports.INVALID;
						if (value.status === "aborted") return exports.INVALID;
						if (key.status === "dirty") status.dirty();
						if (value.status === "dirty") status.dirty();
						if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) finalObject[key.value] = value.value;
					}
					return {
						status: status.value,
						value: finalObject
					};
				}
			};
			exports.INVALID = Object.freeze({ status: "aborted" });
			const DIRTY = (value) => ({
				status: "dirty",
				value
			});
			exports.DIRTY = DIRTY;
			const OK = (value) => ({
				status: "valid",
				value
			});
			exports.OK = OK;
			const isAborted = (x) => x.status === "aborted";
			exports.isAborted = isAborted;
			const isDirty = (x) => x.status === "dirty";
			exports.isDirty = isDirty;
			const isValid = (x) => x.status === "valid";
			exports.isValid = isValid;
			const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
			exports.isAsync = isAsync;
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/typeAliases.cjs
		var require_typeAliases = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/helpers/errorUtil.cjs
		var require_errorUtil = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.errorUtil = void 0;
			var errorUtil;
			(function(errorUtil) {
				errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
				errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
			})(errorUtil || (exports.errorUtil = errorUtil = {}));
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/types.cjs
		var require_types = /* @__PURE__ */ __commonJSMin(((exports) => {
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.discriminatedUnion = exports.date = exports.boolean = exports.bigint = exports.array = exports.any = exports.coerce = exports.ZodFirstPartyTypeKind = exports.late = exports.ZodSchema = exports.Schema = exports.ZodReadonly = exports.ZodPipeline = exports.ZodBranded = exports.BRAND = exports.ZodNaN = exports.ZodCatch = exports.ZodDefault = exports.ZodNullable = exports.ZodOptional = exports.ZodTransformer = exports.ZodEffects = exports.ZodPromise = exports.ZodNativeEnum = exports.ZodEnum = exports.ZodLiteral = exports.ZodLazy = exports.ZodFunction = exports.ZodSet = exports.ZodMap = exports.ZodRecord = exports.ZodTuple = exports.ZodIntersection = exports.ZodDiscriminatedUnion = exports.ZodUnion = exports.ZodObject = exports.ZodArray = exports.ZodVoid = exports.ZodNever = exports.ZodUnknown = exports.ZodAny = exports.ZodNull = exports.ZodUndefined = exports.ZodSymbol = exports.ZodDate = exports.ZodBoolean = exports.ZodBigInt = exports.ZodNumber = exports.ZodString = exports.ZodType = void 0;
			exports.NEVER = exports.void = exports.unknown = exports.union = exports.undefined = exports.tuple = exports.transformer = exports.symbol = exports.string = exports.strictObject = exports.set = exports.record = exports.promise = exports.preprocess = exports.pipeline = exports.ostring = exports.optional = exports.onumber = exports.oboolean = exports.object = exports.number = exports.nullable = exports.null = exports.never = exports.nativeEnum = exports.nan = exports.map = exports.literal = exports.lazy = exports.intersection = exports.instanceof = exports.function = exports.enum = exports.effect = void 0;
			exports.datetimeRegex = datetimeRegex;
			exports.custom = custom;
			const ZodError_js_1 = require_ZodError();
			const errors_js_1 = require_errors();
			const errorUtil_js_1 = require_errorUtil();
			const parseUtil_js_1 = require_parseUtil();
			const util_js_1 = require_util();
			var ParseInputLazyPath = class {
				constructor(parent, value, path, key) {
					this._cachedPath = [];
					this.parent = parent;
					this.data = value;
					this._path = path;
					this._key = key;
				}
				get path() {
					if (!this._cachedPath.length) {
						if (Array.isArray(this._key)) this._cachedPath.push(...this._path, ...this._key);
						else this._cachedPath.push(...this._path, this._key);
					}
					return this._cachedPath;
				}
			};
			const handleResult = (ctx, result) => {
				if ((0, parseUtil_js_1.isValid)(result)) return {
					success: true,
					data: result.value
				};
				else {
					if (!ctx.common.issues.length) throw new Error("Validation failed but no issues detected.");
					return {
						success: false,
						get error() {
							if (this._error) return this._error;
							const error = new ZodError_js_1.ZodError(ctx.common.issues);
							this._error = error;
							return this._error;
						}
					};
				}
			};
			function processCreateParams(params) {
				if (!params) return {};
				const { errorMap, invalid_type_error, required_error, description } = params;
				if (errorMap && (invalid_type_error || required_error)) throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
				if (errorMap) return {
					errorMap,
					description
				};
				const customMap = (iss, ctx) => {
					const { message } = params;
					if (iss.code === "invalid_enum_value") return { message: message ?? ctx.defaultError };
					if (typeof ctx.data === "undefined") return { message: message ?? required_error ?? ctx.defaultError };
					if (iss.code !== "invalid_type") return { message: ctx.defaultError };
					return { message: message ?? invalid_type_error ?? ctx.defaultError };
				};
				return {
					errorMap: customMap,
					description
				};
			}
			var ZodType = class {
				get description() {
					return this._def.description;
				}
				_getType(input) {
					return (0, util_js_1.getParsedType)(input.data);
				}
				_getOrReturnCtx(input, ctx) {
					return ctx || {
						common: input.parent.common,
						data: input.data,
						parsedType: (0, util_js_1.getParsedType)(input.data),
						schemaErrorMap: this._def.errorMap,
						path: input.path,
						parent: input.parent
					};
				}
				_processInputParams(input) {
					return {
						status: new parseUtil_js_1.ParseStatus(),
						ctx: {
							common: input.parent.common,
							data: input.data,
							parsedType: (0, util_js_1.getParsedType)(input.data),
							schemaErrorMap: this._def.errorMap,
							path: input.path,
							parent: input.parent
						}
					};
				}
				_parseSync(input) {
					const result = this._parse(input);
					if ((0, parseUtil_js_1.isAsync)(result)) throw new Error("Synchronous parse encountered promise.");
					return result;
				}
				_parseAsync(input) {
					const result = this._parse(input);
					return Promise.resolve(result);
				}
				parse(data, params) {
					const result = this.safeParse(data, params);
					if (result.success) return result.data;
					throw result.error;
				}
				safeParse(data, params) {
					const ctx = {
						common: {
							issues: [],
							async: params?.async ?? false,
							contextualErrorMap: params?.errorMap
						},
						path: params?.path || [],
						schemaErrorMap: this._def.errorMap,
						parent: null,
						data,
						parsedType: (0, util_js_1.getParsedType)(data)
					};
					const result = this._parseSync({
						data,
						path: ctx.path,
						parent: ctx
					});
					return handleResult(ctx, result);
				}
				"~validate"(data) {
					const ctx = {
						common: {
							issues: [],
							async: !!this["~standard"].async
						},
						path: [],
						schemaErrorMap: this._def.errorMap,
						parent: null,
						data,
						parsedType: (0, util_js_1.getParsedType)(data)
					};
					if (!this["~standard"].async) try {
						const result = this._parseSync({
							data,
							path: [],
							parent: ctx
						});
						return (0, parseUtil_js_1.isValid)(result) ? { value: result.value } : { issues: ctx.common.issues };
					} catch (err) {
						if (err?.message?.toLowerCase()?.includes("encountered")) this["~standard"].async = true;
						ctx.common = {
							issues: [],
							async: true
						};
					}
					return this._parseAsync({
						data,
						path: [],
						parent: ctx
					}).then((result) => (0, parseUtil_js_1.isValid)(result) ? { value: result.value } : { issues: ctx.common.issues });
				}
				async parseAsync(data, params) {
					const result = await this.safeParseAsync(data, params);
					if (result.success) return result.data;
					throw result.error;
				}
				async safeParseAsync(data, params) {
					const ctx = {
						common: {
							issues: [],
							contextualErrorMap: params?.errorMap,
							async: true
						},
						path: params?.path || [],
						schemaErrorMap: this._def.errorMap,
						parent: null,
						data,
						parsedType: (0, util_js_1.getParsedType)(data)
					};
					const maybeAsyncResult = this._parse({
						data,
						path: ctx.path,
						parent: ctx
					});
					const result = await ((0, parseUtil_js_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
					return handleResult(ctx, result);
				}
				refine(check, message) {
					const getIssueProperties = (val) => {
						if (typeof message === "string" || typeof message === "undefined") return { message };
						else if (typeof message === "function") return message(val);
						else return message;
					};
					return this._refinement((val, ctx) => {
						const result = check(val);
						const setError = () => ctx.addIssue({
							code: ZodError_js_1.ZodIssueCode.custom,
							...getIssueProperties(val)
						});
						if (typeof Promise !== "undefined" && result instanceof Promise) return result.then((data) => {
							if (!data) {
								setError();
								return false;
							} else return true;
						});
						if (!result) {
							setError();
							return false;
						} else return true;
					});
				}
				refinement(check, refinementData) {
					return this._refinement((val, ctx) => {
						if (!check(val)) {
							ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
							return false;
						} else return true;
					});
				}
				_refinement(refinement) {
					return new ZodEffects({
						schema: this,
						typeName: ZodFirstPartyTypeKind.ZodEffects,
						effect: {
							type: "refinement",
							refinement
						}
					});
				}
				superRefine(refinement) {
					return this._refinement(refinement);
				}
				constructor(def) {
					/** Alias of safeParseAsync */
					this.spa = this.safeParseAsync;
					this._def = def;
					this.parse = this.parse.bind(this);
					this.safeParse = this.safeParse.bind(this);
					this.parseAsync = this.parseAsync.bind(this);
					this.safeParseAsync = this.safeParseAsync.bind(this);
					this.spa = this.spa.bind(this);
					this.refine = this.refine.bind(this);
					this.refinement = this.refinement.bind(this);
					this.superRefine = this.superRefine.bind(this);
					this.optional = this.optional.bind(this);
					this.nullable = this.nullable.bind(this);
					this.nullish = this.nullish.bind(this);
					this.array = this.array.bind(this);
					this.promise = this.promise.bind(this);
					this.or = this.or.bind(this);
					this.and = this.and.bind(this);
					this.transform = this.transform.bind(this);
					this.brand = this.brand.bind(this);
					this.default = this.default.bind(this);
					this.catch = this.catch.bind(this);
					this.describe = this.describe.bind(this);
					this.pipe = this.pipe.bind(this);
					this.readonly = this.readonly.bind(this);
					this.isNullable = this.isNullable.bind(this);
					this.isOptional = this.isOptional.bind(this);
					this["~standard"] = {
						version: 1,
						vendor: "zod",
						validate: (data) => this["~validate"](data)
					};
				}
				optional() {
					return ZodOptional.create(this, this._def);
				}
				nullable() {
					return ZodNullable.create(this, this._def);
				}
				nullish() {
					return this.nullable().optional();
				}
				array() {
					return ZodArray.create(this);
				}
				promise() {
					return ZodPromise.create(this, this._def);
				}
				or(option) {
					return ZodUnion.create([this, option], this._def);
				}
				and(incoming) {
					return ZodIntersection.create(this, incoming, this._def);
				}
				transform(transform) {
					return new ZodEffects({
						...processCreateParams(this._def),
						schema: this,
						typeName: ZodFirstPartyTypeKind.ZodEffects,
						effect: {
							type: "transform",
							transform
						}
					});
				}
				default(def) {
					const defaultValueFunc = typeof def === "function" ? def : () => def;
					return new ZodDefault({
						...processCreateParams(this._def),
						innerType: this,
						defaultValue: defaultValueFunc,
						typeName: ZodFirstPartyTypeKind.ZodDefault
					});
				}
				brand() {
					return new ZodBranded({
						typeName: ZodFirstPartyTypeKind.ZodBranded,
						type: this,
						...processCreateParams(this._def)
					});
				}
				catch(def) {
					const catchValueFunc = typeof def === "function" ? def : () => def;
					return new ZodCatch({
						...processCreateParams(this._def),
						innerType: this,
						catchValue: catchValueFunc,
						typeName: ZodFirstPartyTypeKind.ZodCatch
					});
				}
				describe(description) {
					const This = this.constructor;
					return new This({
						...this._def,
						description
					});
				}
				pipe(target) {
					return ZodPipeline.create(this, target);
				}
				readonly() {
					return ZodReadonly.create(this);
				}
				isOptional() {
					return this.safeParse(void 0).success;
				}
				isNullable() {
					return this.safeParse(null).success;
				}
			};
			exports.ZodType = ZodType;
			exports.Schema = ZodType;
			exports.ZodSchema = ZodType;
			const cuidRegex = /^c[^\s-]{8,}$/i;
			const cuid2Regex = /^[0-9a-z]+$/;
			const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
			const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
			const nanoidRegex = /^[a-z0-9_-]{21}$/i;
			const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
			const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
			const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
			const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
			let emojiRegex;
			const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
			const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
			const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
			const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
			const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
			const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
			const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
			const dateRegex = new RegExp(`^${dateRegexSource}$`);
			function timeRegexSource(args) {
				let secondsRegexSource = `[0-5]\\d`;
				if (args.precision) secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
				else if (args.precision == null) secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
				const secondsQuantifier = args.precision ? "+" : "?";
				return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
			}
			function timeRegex(args) {
				return new RegExp(`^${timeRegexSource(args)}$`);
			}
			function datetimeRegex(args) {
				let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
				const opts = [];
				opts.push(args.local ? `Z?` : `Z`);
				if (args.offset) opts.push(`([+-]\\d{2}:?\\d{2})`);
				regex = `${regex}(${opts.join("|")})`;
				return new RegExp(`^${regex}$`);
			}
			function isValidIP(ip, version) {
				if ((version === "v4" || !version) && ipv4Regex.test(ip)) return true;
				if ((version === "v6" || !version) && ipv6Regex.test(ip)) return true;
				return false;
			}
			function isValidJWT(jwt, alg) {
				if (!jwtRegex.test(jwt)) return false;
				try {
					const [header] = jwt.split(".");
					if (!header) return false;
					const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
					const decoded = JSON.parse(atob(base64));
					if (typeof decoded !== "object" || decoded === null) return false;
					if ("typ" in decoded && decoded?.typ !== "JWT") return false;
					if (!decoded.alg) return false;
					if (alg && decoded.alg !== alg) return false;
					return true;
				} catch {
					return false;
				}
			}
			function isValidCidr(ip, version) {
				if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) return true;
				if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) return true;
				return false;
			}
			var ZodString = class ZodString extends ZodType {
				_parse(input) {
					if (this._def.coerce) input.data = String(input.data);
					if (this._getType(input) !== util_js_1.ZodParsedType.string) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.string,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const status = new parseUtil_js_1.ParseStatus();
					let ctx = void 0;
					for (const check of this._def.checks) if (check.kind === "min") {
						if (input.data.length < check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								minimum: check.value,
								type: "string",
								inclusive: true,
								exact: false,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "max") {
						if (input.data.length > check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								maximum: check.value,
								type: "string",
								inclusive: true,
								exact: false,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "length") {
						const tooBig = input.data.length > check.value;
						const tooSmall = input.data.length < check.value;
						if (tooBig || tooSmall) {
							ctx = this._getOrReturnCtx(input, ctx);
							if (tooBig) (0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								maximum: check.value,
								type: "string",
								inclusive: true,
								exact: true,
								message: check.message
							});
							else if (tooSmall) (0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								minimum: check.value,
								type: "string",
								inclusive: true,
								exact: true,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "email") {
						if (!emailRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "email",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "emoji") {
						if (!emojiRegex) emojiRegex = new RegExp(_emojiRegex, "u");
						if (!emojiRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "emoji",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "uuid") {
						if (!uuidRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "uuid",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "nanoid") {
						if (!nanoidRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "nanoid",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "cuid") {
						if (!cuidRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "cuid",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "cuid2") {
						if (!cuid2Regex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "cuid2",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "ulid") {
						if (!ulidRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "ulid",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "url") try {
						new URL(input.data);
					} catch {
						ctx = this._getOrReturnCtx(input, ctx);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							validation: "url",
							code: ZodError_js_1.ZodIssueCode.invalid_string,
							message: check.message
						});
						status.dirty();
					}
					else if (check.kind === "regex") {
						check.regex.lastIndex = 0;
						if (!check.regex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "regex",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "trim") input.data = input.data.trim();
					else if (check.kind === "includes") {
						if (!input.data.includes(check.value, check.position)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: {
									includes: check.value,
									position: check.position
								},
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "toLowerCase") input.data = input.data.toLowerCase();
					else if (check.kind === "toUpperCase") input.data = input.data.toUpperCase();
					else if (check.kind === "startsWith") {
						if (!input.data.startsWith(check.value)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: { startsWith: check.value },
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "endsWith") {
						if (!input.data.endsWith(check.value)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: { endsWith: check.value },
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "datetime") {
						if (!datetimeRegex(check).test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: "datetime",
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "date") {
						if (!dateRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: "date",
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "time") {
						if (!timeRegex(check).test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								validation: "time",
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "duration") {
						if (!durationRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "duration",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "ip") {
						if (!isValidIP(input.data, check.version)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "ip",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "jwt") {
						if (!isValidJWT(input.data, check.alg)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "jwt",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "cidr") {
						if (!isValidCidr(input.data, check.version)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "cidr",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "base64") {
						if (!base64Regex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "base64",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "base64url") {
						if (!base64urlRegex.test(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								validation: "base64url",
								code: ZodError_js_1.ZodIssueCode.invalid_string,
								message: check.message
							});
							status.dirty();
						}
					} else util_js_1.util.assertNever(check);
					return {
						status: status.value,
						value: input.data
					};
				}
				_regex(regex, validation, message) {
					return this.refinement((data) => regex.test(data), {
						validation,
						code: ZodError_js_1.ZodIssueCode.invalid_string,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				_addCheck(check) {
					return new ZodString({
						...this._def,
						checks: [...this._def.checks, check]
					});
				}
				email(message) {
					return this._addCheck({
						kind: "email",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				url(message) {
					return this._addCheck({
						kind: "url",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				emoji(message) {
					return this._addCheck({
						kind: "emoji",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				uuid(message) {
					return this._addCheck({
						kind: "uuid",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				nanoid(message) {
					return this._addCheck({
						kind: "nanoid",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				cuid(message) {
					return this._addCheck({
						kind: "cuid",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				cuid2(message) {
					return this._addCheck({
						kind: "cuid2",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				ulid(message) {
					return this._addCheck({
						kind: "ulid",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				base64(message) {
					return this._addCheck({
						kind: "base64",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				base64url(message) {
					return this._addCheck({
						kind: "base64url",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				jwt(options) {
					return this._addCheck({
						kind: "jwt",
						...errorUtil_js_1.errorUtil.errToObj(options)
					});
				}
				ip(options) {
					return this._addCheck({
						kind: "ip",
						...errorUtil_js_1.errorUtil.errToObj(options)
					});
				}
				cidr(options) {
					return this._addCheck({
						kind: "cidr",
						...errorUtil_js_1.errorUtil.errToObj(options)
					});
				}
				datetime(options) {
					if (typeof options === "string") return this._addCheck({
						kind: "datetime",
						precision: null,
						offset: false,
						local: false,
						message: options
					});
					return this._addCheck({
						kind: "datetime",
						precision: typeof options?.precision === "undefined" ? null : options?.precision,
						offset: options?.offset ?? false,
						local: options?.local ?? false,
						...errorUtil_js_1.errorUtil.errToObj(options?.message)
					});
				}
				date(message) {
					return this._addCheck({
						kind: "date",
						message
					});
				}
				time(options) {
					if (typeof options === "string") return this._addCheck({
						kind: "time",
						precision: null,
						message: options
					});
					return this._addCheck({
						kind: "time",
						precision: typeof options?.precision === "undefined" ? null : options?.precision,
						...errorUtil_js_1.errorUtil.errToObj(options?.message)
					});
				}
				duration(message) {
					return this._addCheck({
						kind: "duration",
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				regex(regex, message) {
					return this._addCheck({
						kind: "regex",
						regex,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				includes(value, options) {
					return this._addCheck({
						kind: "includes",
						value,
						position: options?.position,
						...errorUtil_js_1.errorUtil.errToObj(options?.message)
					});
				}
				startsWith(value, message) {
					return this._addCheck({
						kind: "startsWith",
						value,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				endsWith(value, message) {
					return this._addCheck({
						kind: "endsWith",
						value,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				min(minLength, message) {
					return this._addCheck({
						kind: "min",
						value: minLength,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				max(maxLength, message) {
					return this._addCheck({
						kind: "max",
						value: maxLength,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				length(len, message) {
					return this._addCheck({
						kind: "length",
						value: len,
						...errorUtil_js_1.errorUtil.errToObj(message)
					});
				}
				/**
				* Equivalent to `.min(1)`
				*/
				nonempty(message) {
					return this.min(1, errorUtil_js_1.errorUtil.errToObj(message));
				}
				trim() {
					return new ZodString({
						...this._def,
						checks: [...this._def.checks, { kind: "trim" }]
					});
				}
				toLowerCase() {
					return new ZodString({
						...this._def,
						checks: [...this._def.checks, { kind: "toLowerCase" }]
					});
				}
				toUpperCase() {
					return new ZodString({
						...this._def,
						checks: [...this._def.checks, { kind: "toUpperCase" }]
					});
				}
				get isDatetime() {
					return !!this._def.checks.find((ch) => ch.kind === "datetime");
				}
				get isDate() {
					return !!this._def.checks.find((ch) => ch.kind === "date");
				}
				get isTime() {
					return !!this._def.checks.find((ch) => ch.kind === "time");
				}
				get isDuration() {
					return !!this._def.checks.find((ch) => ch.kind === "duration");
				}
				get isEmail() {
					return !!this._def.checks.find((ch) => ch.kind === "email");
				}
				get isURL() {
					return !!this._def.checks.find((ch) => ch.kind === "url");
				}
				get isEmoji() {
					return !!this._def.checks.find((ch) => ch.kind === "emoji");
				}
				get isUUID() {
					return !!this._def.checks.find((ch) => ch.kind === "uuid");
				}
				get isNANOID() {
					return !!this._def.checks.find((ch) => ch.kind === "nanoid");
				}
				get isCUID() {
					return !!this._def.checks.find((ch) => ch.kind === "cuid");
				}
				get isCUID2() {
					return !!this._def.checks.find((ch) => ch.kind === "cuid2");
				}
				get isULID() {
					return !!this._def.checks.find((ch) => ch.kind === "ulid");
				}
				get isIP() {
					return !!this._def.checks.find((ch) => ch.kind === "ip");
				}
				get isCIDR() {
					return !!this._def.checks.find((ch) => ch.kind === "cidr");
				}
				get isBase64() {
					return !!this._def.checks.find((ch) => ch.kind === "base64");
				}
				get isBase64url() {
					return !!this._def.checks.find((ch) => ch.kind === "base64url");
				}
				get minLength() {
					let min = null;
					for (const ch of this._def.checks) if (ch.kind === "min") {
						if (min === null || ch.value > min) min = ch.value;
					}
					return min;
				}
				get maxLength() {
					let max = null;
					for (const ch of this._def.checks) if (ch.kind === "max") {
						if (max === null || ch.value < max) max = ch.value;
					}
					return max;
				}
			};
			exports.ZodString = ZodString;
			ZodString.create = (params) => {
				return new ZodString({
					checks: [],
					typeName: ZodFirstPartyTypeKind.ZodString,
					coerce: params?.coerce ?? false,
					...processCreateParams(params)
				});
			};
			function floatSafeRemainder(val, step) {
				const valDecCount = (val.toString().split(".")[1] || "").length;
				const stepDecCount = (step.toString().split(".")[1] || "").length;
				const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
				return Number.parseInt(val.toFixed(decCount).replace(".", "")) % Number.parseInt(step.toFixed(decCount).replace(".", "")) / 10 ** decCount;
			}
			var ZodNumber = class ZodNumber extends ZodType {
				constructor() {
					super(...arguments);
					this.min = this.gte;
					this.max = this.lte;
					this.step = this.multipleOf;
				}
				_parse(input) {
					if (this._def.coerce) input.data = Number(input.data);
					if (this._getType(input) !== util_js_1.ZodParsedType.number) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.number,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					let ctx = void 0;
					const status = new parseUtil_js_1.ParseStatus();
					for (const check of this._def.checks) if (check.kind === "int") {
						if (!util_js_1.util.isInteger(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.invalid_type,
								expected: "integer",
								received: "float",
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "min") {
						if (check.inclusive ? input.data < check.value : input.data <= check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								minimum: check.value,
								type: "number",
								inclusive: check.inclusive,
								exact: false,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "max") {
						if (check.inclusive ? input.data > check.value : input.data >= check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								maximum: check.value,
								type: "number",
								inclusive: check.inclusive,
								exact: false,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "multipleOf") {
						if (floatSafeRemainder(input.data, check.value) !== 0) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.not_multiple_of,
								multipleOf: check.value,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "finite") {
						if (!Number.isFinite(input.data)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.not_finite,
								message: check.message
							});
							status.dirty();
						}
					} else util_js_1.util.assertNever(check);
					return {
						status: status.value,
						value: input.data
					};
				}
				gte(value, message) {
					return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
				}
				gt(value, message) {
					return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
				}
				lte(value, message) {
					return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
				}
				lt(value, message) {
					return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
				}
				setLimit(kind, value, inclusive, message) {
					return new ZodNumber({
						...this._def,
						checks: [...this._def.checks, {
							kind,
							value,
							inclusive,
							message: errorUtil_js_1.errorUtil.toString(message)
						}]
					});
				}
				_addCheck(check) {
					return new ZodNumber({
						...this._def,
						checks: [...this._def.checks, check]
					});
				}
				int(message) {
					return this._addCheck({
						kind: "int",
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				positive(message) {
					return this._addCheck({
						kind: "min",
						value: 0,
						inclusive: false,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				negative(message) {
					return this._addCheck({
						kind: "max",
						value: 0,
						inclusive: false,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				nonpositive(message) {
					return this._addCheck({
						kind: "max",
						value: 0,
						inclusive: true,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				nonnegative(message) {
					return this._addCheck({
						kind: "min",
						value: 0,
						inclusive: true,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				multipleOf(value, message) {
					return this._addCheck({
						kind: "multipleOf",
						value,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				finite(message) {
					return this._addCheck({
						kind: "finite",
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				safe(message) {
					return this._addCheck({
						kind: "min",
						inclusive: true,
						value: Number.MIN_SAFE_INTEGER,
						message: errorUtil_js_1.errorUtil.toString(message)
					})._addCheck({
						kind: "max",
						inclusive: true,
						value: Number.MAX_SAFE_INTEGER,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				get minValue() {
					let min = null;
					for (const ch of this._def.checks) if (ch.kind === "min") {
						if (min === null || ch.value > min) min = ch.value;
					}
					return min;
				}
				get maxValue() {
					let max = null;
					for (const ch of this._def.checks) if (ch.kind === "max") {
						if (max === null || ch.value < max) max = ch.value;
					}
					return max;
				}
				get isInt() {
					return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util_js_1.util.isInteger(ch.value));
				}
				get isFinite() {
					let max = null;
					let min = null;
					for (const ch of this._def.checks) if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") return true;
					else if (ch.kind === "min") {
						if (min === null || ch.value > min) min = ch.value;
					} else if (ch.kind === "max") {
						if (max === null || ch.value < max) max = ch.value;
					}
					return Number.isFinite(min) && Number.isFinite(max);
				}
			};
			exports.ZodNumber = ZodNumber;
			ZodNumber.create = (params) => {
				return new ZodNumber({
					checks: [],
					typeName: ZodFirstPartyTypeKind.ZodNumber,
					coerce: params?.coerce || false,
					...processCreateParams(params)
				});
			};
			var ZodBigInt = class ZodBigInt extends ZodType {
				constructor() {
					super(...arguments);
					this.min = this.gte;
					this.max = this.lte;
				}
				_parse(input) {
					if (this._def.coerce) try {
						input.data = BigInt(input.data);
					} catch {
						return this._getInvalidInput(input);
					}
					if (this._getType(input) !== util_js_1.ZodParsedType.bigint) return this._getInvalidInput(input);
					let ctx = void 0;
					const status = new parseUtil_js_1.ParseStatus();
					for (const check of this._def.checks) if (check.kind === "min") {
						if (check.inclusive ? input.data < check.value : input.data <= check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								type: "bigint",
								minimum: check.value,
								inclusive: check.inclusive,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "max") {
						if (check.inclusive ? input.data > check.value : input.data >= check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								type: "bigint",
								maximum: check.value,
								inclusive: check.inclusive,
								message: check.message
							});
							status.dirty();
						}
					} else if (check.kind === "multipleOf") {
						if (input.data % check.value !== BigInt(0)) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.not_multiple_of,
								multipleOf: check.value,
								message: check.message
							});
							status.dirty();
						}
					} else util_js_1.util.assertNever(check);
					return {
						status: status.value,
						value: input.data
					};
				}
				_getInvalidInput(input) {
					const ctx = this._getOrReturnCtx(input);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_type,
						expected: util_js_1.ZodParsedType.bigint,
						received: ctx.parsedType
					});
					return parseUtil_js_1.INVALID;
				}
				gte(value, message) {
					return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
				}
				gt(value, message) {
					return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
				}
				lte(value, message) {
					return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
				}
				lt(value, message) {
					return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
				}
				setLimit(kind, value, inclusive, message) {
					return new ZodBigInt({
						...this._def,
						checks: [...this._def.checks, {
							kind,
							value,
							inclusive,
							message: errorUtil_js_1.errorUtil.toString(message)
						}]
					});
				}
				_addCheck(check) {
					return new ZodBigInt({
						...this._def,
						checks: [...this._def.checks, check]
					});
				}
				positive(message) {
					return this._addCheck({
						kind: "min",
						value: BigInt(0),
						inclusive: false,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				negative(message) {
					return this._addCheck({
						kind: "max",
						value: BigInt(0),
						inclusive: false,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				nonpositive(message) {
					return this._addCheck({
						kind: "max",
						value: BigInt(0),
						inclusive: true,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				nonnegative(message) {
					return this._addCheck({
						kind: "min",
						value: BigInt(0),
						inclusive: true,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				multipleOf(value, message) {
					return this._addCheck({
						kind: "multipleOf",
						value,
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				get minValue() {
					let min = null;
					for (const ch of this._def.checks) if (ch.kind === "min") {
						if (min === null || ch.value > min) min = ch.value;
					}
					return min;
				}
				get maxValue() {
					let max = null;
					for (const ch of this._def.checks) if (ch.kind === "max") {
						if (max === null || ch.value < max) max = ch.value;
					}
					return max;
				}
			};
			exports.ZodBigInt = ZodBigInt;
			ZodBigInt.create = (params) => {
				return new ZodBigInt({
					checks: [],
					typeName: ZodFirstPartyTypeKind.ZodBigInt,
					coerce: params?.coerce ?? false,
					...processCreateParams(params)
				});
			};
			var ZodBoolean = class extends ZodType {
				_parse(input) {
					if (this._def.coerce) input.data = Boolean(input.data);
					if (this._getType(input) !== util_js_1.ZodParsedType.boolean) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.boolean,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodBoolean = ZodBoolean;
			ZodBoolean.create = (params) => {
				return new ZodBoolean({
					typeName: ZodFirstPartyTypeKind.ZodBoolean,
					coerce: params?.coerce || false,
					...processCreateParams(params)
				});
			};
			var ZodDate = class ZodDate extends ZodType {
				_parse(input) {
					if (this._def.coerce) input.data = new Date(input.data);
					if (this._getType(input) !== util_js_1.ZodParsedType.date) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.date,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					if (Number.isNaN(input.data.getTime())) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, { code: ZodError_js_1.ZodIssueCode.invalid_date });
						return parseUtil_js_1.INVALID;
					}
					const status = new parseUtil_js_1.ParseStatus();
					let ctx = void 0;
					for (const check of this._def.checks) if (check.kind === "min") {
						if (input.data.getTime() < check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								message: check.message,
								inclusive: true,
								exact: false,
								minimum: check.value,
								type: "date"
							});
							status.dirty();
						}
					} else if (check.kind === "max") {
						if (input.data.getTime() > check.value) {
							ctx = this._getOrReturnCtx(input, ctx);
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								message: check.message,
								inclusive: true,
								exact: false,
								maximum: check.value,
								type: "date"
							});
							status.dirty();
						}
					} else util_js_1.util.assertNever(check);
					return {
						status: status.value,
						value: new Date(input.data.getTime())
					};
				}
				_addCheck(check) {
					return new ZodDate({
						...this._def,
						checks: [...this._def.checks, check]
					});
				}
				min(minDate, message) {
					return this._addCheck({
						kind: "min",
						value: minDate.getTime(),
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				max(maxDate, message) {
					return this._addCheck({
						kind: "max",
						value: maxDate.getTime(),
						message: errorUtil_js_1.errorUtil.toString(message)
					});
				}
				get minDate() {
					let min = null;
					for (const ch of this._def.checks) if (ch.kind === "min") {
						if (min === null || ch.value > min) min = ch.value;
					}
					return min != null ? new Date(min) : null;
				}
				get maxDate() {
					let max = null;
					for (const ch of this._def.checks) if (ch.kind === "max") {
						if (max === null || ch.value < max) max = ch.value;
					}
					return max != null ? new Date(max) : null;
				}
			};
			exports.ZodDate = ZodDate;
			ZodDate.create = (params) => {
				return new ZodDate({
					checks: [],
					coerce: params?.coerce || false,
					typeName: ZodFirstPartyTypeKind.ZodDate,
					...processCreateParams(params)
				});
			};
			var ZodSymbol = class extends ZodType {
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.symbol) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.symbol,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodSymbol = ZodSymbol;
			ZodSymbol.create = (params) => {
				return new ZodSymbol({
					typeName: ZodFirstPartyTypeKind.ZodSymbol,
					...processCreateParams(params)
				});
			};
			var ZodUndefined = class extends ZodType {
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.undefined) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.undefined,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodUndefined = ZodUndefined;
			ZodUndefined.create = (params) => {
				return new ZodUndefined({
					typeName: ZodFirstPartyTypeKind.ZodUndefined,
					...processCreateParams(params)
				});
			};
			var ZodNull = class extends ZodType {
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.null) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.null,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodNull = ZodNull;
			ZodNull.create = (params) => {
				return new ZodNull({
					typeName: ZodFirstPartyTypeKind.ZodNull,
					...processCreateParams(params)
				});
			};
			var ZodAny = class extends ZodType {
				constructor() {
					super(...arguments);
					this._any = true;
				}
				_parse(input) {
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodAny = ZodAny;
			ZodAny.create = (params) => {
				return new ZodAny({
					typeName: ZodFirstPartyTypeKind.ZodAny,
					...processCreateParams(params)
				});
			};
			var ZodUnknown = class extends ZodType {
				constructor() {
					super(...arguments);
					this._unknown = true;
				}
				_parse(input) {
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodUnknown = ZodUnknown;
			ZodUnknown.create = (params) => {
				return new ZodUnknown({
					typeName: ZodFirstPartyTypeKind.ZodUnknown,
					...processCreateParams(params)
				});
			};
			var ZodNever = class extends ZodType {
				_parse(input) {
					const ctx = this._getOrReturnCtx(input);
					(0, parseUtil_js_1.addIssueToContext)(ctx, {
						code: ZodError_js_1.ZodIssueCode.invalid_type,
						expected: util_js_1.ZodParsedType.never,
						received: ctx.parsedType
					});
					return parseUtil_js_1.INVALID;
				}
			};
			exports.ZodNever = ZodNever;
			ZodNever.create = (params) => {
				return new ZodNever({
					typeName: ZodFirstPartyTypeKind.ZodNever,
					...processCreateParams(params)
				});
			};
			var ZodVoid = class extends ZodType {
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.undefined) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.void,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
			};
			exports.ZodVoid = ZodVoid;
			ZodVoid.create = (params) => {
				return new ZodVoid({
					typeName: ZodFirstPartyTypeKind.ZodVoid,
					...processCreateParams(params)
				});
			};
			var ZodArray = class ZodArray extends ZodType {
				_parse(input) {
					const { ctx, status } = this._processInputParams(input);
					const def = this._def;
					if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.array,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					if (def.exactLength !== null) {
						const tooBig = ctx.data.length > def.exactLength.value;
						const tooSmall = ctx.data.length < def.exactLength.value;
						if (tooBig || tooSmall) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: tooBig ? ZodError_js_1.ZodIssueCode.too_big : ZodError_js_1.ZodIssueCode.too_small,
								minimum: tooSmall ? def.exactLength.value : void 0,
								maximum: tooBig ? def.exactLength.value : void 0,
								type: "array",
								inclusive: true,
								exact: true,
								message: def.exactLength.message
							});
							status.dirty();
						}
					}
					if (def.minLength !== null) {
						if (ctx.data.length < def.minLength.value) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								minimum: def.minLength.value,
								type: "array",
								inclusive: true,
								exact: false,
								message: def.minLength.message
							});
							status.dirty();
						}
					}
					if (def.maxLength !== null) {
						if (ctx.data.length > def.maxLength.value) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								maximum: def.maxLength.value,
								type: "array",
								inclusive: true,
								exact: false,
								message: def.maxLength.message
							});
							status.dirty();
						}
					}
					if (ctx.common.async) return Promise.all([...ctx.data].map((item, i) => {
						return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
					})).then((result) => {
						return parseUtil_js_1.ParseStatus.mergeArray(status, result);
					});
					const result = [...ctx.data].map((item, i) => {
						return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
					});
					return parseUtil_js_1.ParseStatus.mergeArray(status, result);
				}
				get element() {
					return this._def.type;
				}
				min(minLength, message) {
					return new ZodArray({
						...this._def,
						minLength: {
							value: minLength,
							message: errorUtil_js_1.errorUtil.toString(message)
						}
					});
				}
				max(maxLength, message) {
					return new ZodArray({
						...this._def,
						maxLength: {
							value: maxLength,
							message: errorUtil_js_1.errorUtil.toString(message)
						}
					});
				}
				length(len, message) {
					return new ZodArray({
						...this._def,
						exactLength: {
							value: len,
							message: errorUtil_js_1.errorUtil.toString(message)
						}
					});
				}
				nonempty(message) {
					return this.min(1, message);
				}
			};
			exports.ZodArray = ZodArray;
			ZodArray.create = (schema, params) => {
				return new ZodArray({
					type: schema,
					minLength: null,
					maxLength: null,
					exactLength: null,
					typeName: ZodFirstPartyTypeKind.ZodArray,
					...processCreateParams(params)
				});
			};
			function deepPartialify(schema) {
				if (schema instanceof ZodObject) {
					const newShape = {};
					for (const key in schema.shape) {
						const fieldSchema = schema.shape[key];
						newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
					}
					return new ZodObject({
						...schema._def,
						shape: () => newShape
					});
				} else if (schema instanceof ZodArray) return new ZodArray({
					...schema._def,
					type: deepPartialify(schema.element)
				});
				else if (schema instanceof ZodOptional) return ZodOptional.create(deepPartialify(schema.unwrap()));
				else if (schema instanceof ZodNullable) return ZodNullable.create(deepPartialify(schema.unwrap()));
				else if (schema instanceof ZodTuple) return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
				else return schema;
			}
			var ZodObject = class ZodObject extends ZodType {
				constructor() {
					super(...arguments);
					this._cached = null;
					/**
					* @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
					* If you want to pass through unknown properties, use `.passthrough()` instead.
					*/
					this.nonstrict = this.passthrough;
					/**
					* @deprecated Use `.extend` instead
					*  */
					this.augment = this.extend;
				}
				_getCached() {
					if (this._cached !== null) return this._cached;
					const shape = this._def.shape();
					const keys = util_js_1.util.objectKeys(shape);
					this._cached = {
						shape,
						keys
					};
					return this._cached;
				}
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.object) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.object,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const { status, ctx } = this._processInputParams(input);
					const { shape, keys: shapeKeys } = this._getCached();
					const extraKeys = [];
					if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
						for (const key in ctx.data) if (!shapeKeys.includes(key)) extraKeys.push(key);
					}
					const pairs = [];
					for (const key of shapeKeys) {
						const keyValidator = shape[key];
						const value = ctx.data[key];
						pairs.push({
							key: {
								status: "valid",
								value: key
							},
							value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
							alwaysSet: key in ctx.data
						});
					}
					if (this._def.catchall instanceof ZodNever) {
						const unknownKeys = this._def.unknownKeys;
						if (unknownKeys === "passthrough") for (const key of extraKeys) pairs.push({
							key: {
								status: "valid",
								value: key
							},
							value: {
								status: "valid",
								value: ctx.data[key]
							}
						});
						else if (unknownKeys === "strict") {
							if (extraKeys.length > 0) {
								(0, parseUtil_js_1.addIssueToContext)(ctx, {
									code: ZodError_js_1.ZodIssueCode.unrecognized_keys,
									keys: extraKeys
								});
								status.dirty();
							}
						} else if (unknownKeys === "strip") {} else throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
					} else {
						const catchall = this._def.catchall;
						for (const key of extraKeys) {
							const value = ctx.data[key];
							pairs.push({
								key: {
									status: "valid",
									value: key
								},
								value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
								alwaysSet: key in ctx.data
							});
						}
					}
					if (ctx.common.async) return Promise.resolve().then(async () => {
						const syncPairs = [];
						for (const pair of pairs) {
							const key = await pair.key;
							const value = await pair.value;
							syncPairs.push({
								key,
								value,
								alwaysSet: pair.alwaysSet
							});
						}
						return syncPairs;
					}).then((syncPairs) => {
						return parseUtil_js_1.ParseStatus.mergeObjectSync(status, syncPairs);
					});
					else return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
				}
				get shape() {
					return this._def.shape();
				}
				strict(message) {
					errorUtil_js_1.errorUtil.errToObj;
					return new ZodObject({
						...this._def,
						unknownKeys: "strict",
						...message !== void 0 ? { errorMap: (issue, ctx) => {
							const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
							if (issue.code === "unrecognized_keys") return { message: errorUtil_js_1.errorUtil.errToObj(message).message ?? defaultError };
							return { message: defaultError };
						} } : {}
					});
				}
				strip() {
					return new ZodObject({
						...this._def,
						unknownKeys: "strip"
					});
				}
				passthrough() {
					return new ZodObject({
						...this._def,
						unknownKeys: "passthrough"
					});
				}
				extend(augmentation) {
					return new ZodObject({
						...this._def,
						shape: () => ({
							...this._def.shape(),
							...augmentation
						})
					});
				}
				/**
				* Prior to zod@1.0.12 there was a bug in the
				* inferred type of merged objects. Please
				* upgrade if you are experiencing issues.
				*/
				merge(merging) {
					return new ZodObject({
						unknownKeys: merging._def.unknownKeys,
						catchall: merging._def.catchall,
						shape: () => ({
							...this._def.shape(),
							...merging._def.shape()
						}),
						typeName: ZodFirstPartyTypeKind.ZodObject
					});
				}
				setKey(key, schema) {
					return this.augment({ [key]: schema });
				}
				catchall(index) {
					return new ZodObject({
						...this._def,
						catchall: index
					});
				}
				pick(mask) {
					const shape = {};
					for (const key of util_js_1.util.objectKeys(mask)) if (mask[key] && this.shape[key]) shape[key] = this.shape[key];
					return new ZodObject({
						...this._def,
						shape: () => shape
					});
				}
				omit(mask) {
					const shape = {};
					for (const key of util_js_1.util.objectKeys(this.shape)) if (!mask[key]) shape[key] = this.shape[key];
					return new ZodObject({
						...this._def,
						shape: () => shape
					});
				}
				/**
				* @deprecated
				*/
				deepPartial() {
					return deepPartialify(this);
				}
				partial(mask) {
					const newShape = {};
					for (const key of util_js_1.util.objectKeys(this.shape)) {
						const fieldSchema = this.shape[key];
						if (mask && !mask[key]) newShape[key] = fieldSchema;
						else newShape[key] = fieldSchema.optional();
					}
					return new ZodObject({
						...this._def,
						shape: () => newShape
					});
				}
				required(mask) {
					const newShape = {};
					for (const key of util_js_1.util.objectKeys(this.shape)) if (mask && !mask[key]) newShape[key] = this.shape[key];
					else {
						let newField = this.shape[key];
						while (newField instanceof ZodOptional) newField = newField._def.innerType;
						newShape[key] = newField;
					}
					return new ZodObject({
						...this._def,
						shape: () => newShape
					});
				}
				keyof() {
					return createZodEnum(util_js_1.util.objectKeys(this.shape));
				}
			};
			exports.ZodObject = ZodObject;
			ZodObject.create = (shape, params) => {
				return new ZodObject({
					shape: () => shape,
					unknownKeys: "strip",
					catchall: ZodNever.create(),
					typeName: ZodFirstPartyTypeKind.ZodObject,
					...processCreateParams(params)
				});
			};
			ZodObject.strictCreate = (shape, params) => {
				return new ZodObject({
					shape: () => shape,
					unknownKeys: "strict",
					catchall: ZodNever.create(),
					typeName: ZodFirstPartyTypeKind.ZodObject,
					...processCreateParams(params)
				});
			};
			ZodObject.lazycreate = (shape, params) => {
				return new ZodObject({
					shape,
					unknownKeys: "strip",
					catchall: ZodNever.create(),
					typeName: ZodFirstPartyTypeKind.ZodObject,
					...processCreateParams(params)
				});
			};
			var ZodUnion = class extends ZodType {
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					const options = this._def.options;
					function handleResults(results) {
						for (const result of results) if (result.result.status === "valid") return result.result;
						for (const result of results) if (result.result.status === "dirty") {
							ctx.common.issues.push(...result.ctx.common.issues);
							return result.result;
						}
						const unionErrors = results.map((result) => new ZodError_js_1.ZodError(result.ctx.common.issues));
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_union,
							unionErrors
						});
						return parseUtil_js_1.INVALID;
					}
					if (ctx.common.async) return Promise.all(options.map(async (option) => {
						const childCtx = {
							...ctx,
							common: {
								...ctx.common,
								issues: []
							},
							parent: null
						};
						return {
							result: await option._parseAsync({
								data: ctx.data,
								path: ctx.path,
								parent: childCtx
							}),
							ctx: childCtx
						};
					})).then(handleResults);
					else {
						let dirty = void 0;
						const issues = [];
						for (const option of options) {
							const childCtx = {
								...ctx,
								common: {
									...ctx.common,
									issues: []
								},
								parent: null
							};
							const result = option._parseSync({
								data: ctx.data,
								path: ctx.path,
								parent: childCtx
							});
							if (result.status === "valid") return result;
							else if (result.status === "dirty" && !dirty) dirty = {
								result,
								ctx: childCtx
							};
							if (childCtx.common.issues.length) issues.push(childCtx.common.issues);
						}
						if (dirty) {
							ctx.common.issues.push(...dirty.ctx.common.issues);
							return dirty.result;
						}
						const unionErrors = issues.map((issues) => new ZodError_js_1.ZodError(issues));
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_union,
							unionErrors
						});
						return parseUtil_js_1.INVALID;
					}
				}
				get options() {
					return this._def.options;
				}
			};
			exports.ZodUnion = ZodUnion;
			ZodUnion.create = (types, params) => {
				return new ZodUnion({
					options: types,
					typeName: ZodFirstPartyTypeKind.ZodUnion,
					...processCreateParams(params)
				});
			};
			const getDiscriminator = (type) => {
				if (type instanceof ZodLazy) return getDiscriminator(type.schema);
				else if (type instanceof ZodEffects) return getDiscriminator(type.innerType());
				else if (type instanceof ZodLiteral) return [type.value];
				else if (type instanceof ZodEnum) return type.options;
				else if (type instanceof ZodNativeEnum) return util_js_1.util.objectValues(type.enum);
				else if (type instanceof ZodDefault) return getDiscriminator(type._def.innerType);
				else if (type instanceof ZodUndefined) return [void 0];
				else if (type instanceof ZodNull) return [null];
				else if (type instanceof ZodOptional) return [void 0, ...getDiscriminator(type.unwrap())];
				else if (type instanceof ZodNullable) return [null, ...getDiscriminator(type.unwrap())];
				else if (type instanceof ZodBranded) return getDiscriminator(type.unwrap());
				else if (type instanceof ZodReadonly) return getDiscriminator(type.unwrap());
				else if (type instanceof ZodCatch) return getDiscriminator(type._def.innerType);
				else return [];
			};
			var ZodDiscriminatedUnion = class ZodDiscriminatedUnion extends ZodType {
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.object,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const discriminator = this.discriminator;
					const discriminatorValue = ctx.data[discriminator];
					const option = this.optionsMap.get(discriminatorValue);
					if (!option) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_union_discriminator,
							options: Array.from(this.optionsMap.keys()),
							path: [discriminator]
						});
						return parseUtil_js_1.INVALID;
					}
					if (ctx.common.async) return option._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
					else return option._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
				}
				get discriminator() {
					return this._def.discriminator;
				}
				get options() {
					return this._def.options;
				}
				get optionsMap() {
					return this._def.optionsMap;
				}
				/**
				* The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
				* However, it only allows a union of objects, all of which need to share a discriminator property. This property must
				* have a different value for each object in the union.
				* @param discriminator the name of the discriminator property
				* @param types an array of object schemas
				* @param params
				*/
				static create(discriminator, options, params) {
					const optionsMap = /* @__PURE__ */ new Map();
					for (const type of options) {
						const discriminatorValues = getDiscriminator(type.shape[discriminator]);
						if (!discriminatorValues.length) throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
						for (const value of discriminatorValues) {
							if (optionsMap.has(value)) throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
							optionsMap.set(value, type);
						}
					}
					return new ZodDiscriminatedUnion({
						typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
						discriminator,
						options,
						optionsMap,
						...processCreateParams(params)
					});
				}
			};
			exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion;
			function mergeValues(a, b) {
				const aType = (0, util_js_1.getParsedType)(a);
				const bType = (0, util_js_1.getParsedType)(b);
				if (a === b) return {
					valid: true,
					data: a
				};
				else if (aType === util_js_1.ZodParsedType.object && bType === util_js_1.ZodParsedType.object) {
					const bKeys = util_js_1.util.objectKeys(b);
					const sharedKeys = util_js_1.util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
					const newObj = {
						...a,
						...b
					};
					for (const key of sharedKeys) {
						const sharedValue = mergeValues(a[key], b[key]);
						if (!sharedValue.valid) return { valid: false };
						newObj[key] = sharedValue.data;
					}
					return {
						valid: true,
						data: newObj
					};
				} else if (aType === util_js_1.ZodParsedType.array && bType === util_js_1.ZodParsedType.array) {
					if (a.length !== b.length) return { valid: false };
					const newArray = [];
					for (let index = 0; index < a.length; index++) {
						const itemA = a[index];
						const itemB = b[index];
						const sharedValue = mergeValues(itemA, itemB);
						if (!sharedValue.valid) return { valid: false };
						newArray.push(sharedValue.data);
					}
					return {
						valid: true,
						data: newArray
					};
				} else if (aType === util_js_1.ZodParsedType.date && bType === util_js_1.ZodParsedType.date && +a === +b) return {
					valid: true,
					data: a
				};
				else return { valid: false };
			}
			var ZodIntersection = class extends ZodType {
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					const handleParsed = (parsedLeft, parsedRight) => {
						if ((0, parseUtil_js_1.isAborted)(parsedLeft) || (0, parseUtil_js_1.isAborted)(parsedRight)) return parseUtil_js_1.INVALID;
						const merged = mergeValues(parsedLeft.value, parsedRight.value);
						if (!merged.valid) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, { code: ZodError_js_1.ZodIssueCode.invalid_intersection_types });
							return parseUtil_js_1.INVALID;
						}
						if ((0, parseUtil_js_1.isDirty)(parsedLeft) || (0, parseUtil_js_1.isDirty)(parsedRight)) status.dirty();
						return {
							status: status.value,
							value: merged.data
						};
					};
					if (ctx.common.async) return Promise.all([this._def.left._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					}), this._def.right._parseAsync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					})]).then(([left, right]) => handleParsed(left, right));
					else return handleParsed(this._def.left._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					}), this._def.right._parseSync({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					}));
				}
			};
			exports.ZodIntersection = ZodIntersection;
			ZodIntersection.create = (left, right, params) => {
				return new ZodIntersection({
					left,
					right,
					typeName: ZodFirstPartyTypeKind.ZodIntersection,
					...processCreateParams(params)
				});
			};
			var ZodTuple = class ZodTuple extends ZodType {
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.array,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					if (ctx.data.length < this._def.items.length) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.too_small,
							minimum: this._def.items.length,
							inclusive: true,
							exact: false,
							type: "array"
						});
						return parseUtil_js_1.INVALID;
					}
					if (!this._def.rest && ctx.data.length > this._def.items.length) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.too_big,
							maximum: this._def.items.length,
							inclusive: true,
							exact: false,
							type: "array"
						});
						status.dirty();
					}
					const items = [...ctx.data].map((item, itemIndex) => {
						const schema = this._def.items[itemIndex] || this._def.rest;
						if (!schema) return null;
						return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
					}).filter((x) => !!x);
					if (ctx.common.async) return Promise.all(items).then((results) => {
						return parseUtil_js_1.ParseStatus.mergeArray(status, results);
					});
					else return parseUtil_js_1.ParseStatus.mergeArray(status, items);
				}
				get items() {
					return this._def.items;
				}
				rest(rest) {
					return new ZodTuple({
						...this._def,
						rest
					});
				}
			};
			exports.ZodTuple = ZodTuple;
			ZodTuple.create = (schemas, params) => {
				if (!Array.isArray(schemas)) throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
				return new ZodTuple({
					items: schemas,
					typeName: ZodFirstPartyTypeKind.ZodTuple,
					rest: null,
					...processCreateParams(params)
				});
			};
			var ZodRecord = class ZodRecord extends ZodType {
				get keySchema() {
					return this._def.keyType;
				}
				get valueSchema() {
					return this._def.valueType;
				}
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.object,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const pairs = [];
					const keyType = this._def.keyType;
					const valueType = this._def.valueType;
					for (const key in ctx.data) pairs.push({
						key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
						value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
						alwaysSet: key in ctx.data
					});
					if (ctx.common.async) return parseUtil_js_1.ParseStatus.mergeObjectAsync(status, pairs);
					else return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
				}
				get element() {
					return this._def.valueType;
				}
				static create(first, second, third) {
					if (second instanceof ZodType) return new ZodRecord({
						keyType: first,
						valueType: second,
						typeName: ZodFirstPartyTypeKind.ZodRecord,
						...processCreateParams(third)
					});
					return new ZodRecord({
						keyType: ZodString.create(),
						valueType: first,
						typeName: ZodFirstPartyTypeKind.ZodRecord,
						...processCreateParams(second)
					});
				}
			};
			exports.ZodRecord = ZodRecord;
			var ZodMap = class extends ZodType {
				get keySchema() {
					return this._def.keyType;
				}
				get valueSchema() {
					return this._def.valueType;
				}
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.map) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.map,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const keyType = this._def.keyType;
					const valueType = this._def.valueType;
					const pairs = [...ctx.data.entries()].map(([key, value], index) => {
						return {
							key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
							value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
						};
					});
					if (ctx.common.async) {
						const finalMap = /* @__PURE__ */ new Map();
						return Promise.resolve().then(async () => {
							for (const pair of pairs) {
								const key = await pair.key;
								const value = await pair.value;
								if (key.status === "aborted" || value.status === "aborted") return parseUtil_js_1.INVALID;
								if (key.status === "dirty" || value.status === "dirty") status.dirty();
								finalMap.set(key.value, value.value);
							}
							return {
								status: status.value,
								value: finalMap
							};
						});
					} else {
						const finalMap = /* @__PURE__ */ new Map();
						for (const pair of pairs) {
							const key = pair.key;
							const value = pair.value;
							if (key.status === "aborted" || value.status === "aborted") return parseUtil_js_1.INVALID;
							if (key.status === "dirty" || value.status === "dirty") status.dirty();
							finalMap.set(key.value, value.value);
						}
						return {
							status: status.value,
							value: finalMap
						};
					}
				}
			};
			exports.ZodMap = ZodMap;
			ZodMap.create = (keyType, valueType, params) => {
				return new ZodMap({
					valueType,
					keyType,
					typeName: ZodFirstPartyTypeKind.ZodMap,
					...processCreateParams(params)
				});
			};
			var ZodSet = class ZodSet extends ZodType {
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.set) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.set,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const def = this._def;
					if (def.minSize !== null) {
						if (ctx.data.size < def.minSize.value) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_small,
								minimum: def.minSize.value,
								type: "set",
								inclusive: true,
								exact: false,
								message: def.minSize.message
							});
							status.dirty();
						}
					}
					if (def.maxSize !== null) {
						if (ctx.data.size > def.maxSize.value) {
							(0, parseUtil_js_1.addIssueToContext)(ctx, {
								code: ZodError_js_1.ZodIssueCode.too_big,
								maximum: def.maxSize.value,
								type: "set",
								inclusive: true,
								exact: false,
								message: def.maxSize.message
							});
							status.dirty();
						}
					}
					const valueType = this._def.valueType;
					function finalizeSet(elements) {
						const parsedSet = /* @__PURE__ */ new Set();
						for (const element of elements) {
							if (element.status === "aborted") return parseUtil_js_1.INVALID;
							if (element.status === "dirty") status.dirty();
							parsedSet.add(element.value);
						}
						return {
							status: status.value,
							value: parsedSet
						};
					}
					const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
					if (ctx.common.async) return Promise.all(elements).then((elements) => finalizeSet(elements));
					else return finalizeSet(elements);
				}
				min(minSize, message) {
					return new ZodSet({
						...this._def,
						minSize: {
							value: minSize,
							message: errorUtil_js_1.errorUtil.toString(message)
						}
					});
				}
				max(maxSize, message) {
					return new ZodSet({
						...this._def,
						maxSize: {
							value: maxSize,
							message: errorUtil_js_1.errorUtil.toString(message)
						}
					});
				}
				size(size, message) {
					return this.min(size, message).max(size, message);
				}
				nonempty(message) {
					return this.min(1, message);
				}
			};
			exports.ZodSet = ZodSet;
			ZodSet.create = (valueType, params) => {
				return new ZodSet({
					valueType,
					minSize: null,
					maxSize: null,
					typeName: ZodFirstPartyTypeKind.ZodSet,
					...processCreateParams(params)
				});
			};
			var ZodFunction = class ZodFunction extends ZodType {
				constructor() {
					super(...arguments);
					this.validate = this.implement;
				}
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.function) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.function,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					function makeArgsIssue(args, error) {
						return (0, parseUtil_js_1.makeIssue)({
							data: args,
							path: ctx.path,
							errorMaps: [
								ctx.common.contextualErrorMap,
								ctx.schemaErrorMap,
								(0, errors_js_1.getErrorMap)(),
								errors_js_1.defaultErrorMap
							].filter((x) => !!x),
							issueData: {
								code: ZodError_js_1.ZodIssueCode.invalid_arguments,
								argumentsError: error
							}
						});
					}
					function makeReturnsIssue(returns, error) {
						return (0, parseUtil_js_1.makeIssue)({
							data: returns,
							path: ctx.path,
							errorMaps: [
								ctx.common.contextualErrorMap,
								ctx.schemaErrorMap,
								(0, errors_js_1.getErrorMap)(),
								errors_js_1.defaultErrorMap
							].filter((x) => !!x),
							issueData: {
								code: ZodError_js_1.ZodIssueCode.invalid_return_type,
								returnTypeError: error
							}
						});
					}
					const params = { errorMap: ctx.common.contextualErrorMap };
					const fn = ctx.data;
					if (this._def.returns instanceof ZodPromise) {
						const me = this;
						return (0, parseUtil_js_1.OK)(async function(...args) {
							const error = new ZodError_js_1.ZodError([]);
							const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
								error.addIssue(makeArgsIssue(args, e));
								throw error;
							});
							const result = await Reflect.apply(fn, this, parsedArgs);
							return await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
								error.addIssue(makeReturnsIssue(result, e));
								throw error;
							});
						});
					} else {
						const me = this;
						return (0, parseUtil_js_1.OK)(function(...args) {
							const parsedArgs = me._def.args.safeParse(args, params);
							if (!parsedArgs.success) throw new ZodError_js_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
							const result = Reflect.apply(fn, this, parsedArgs.data);
							const parsedReturns = me._def.returns.safeParse(result, params);
							if (!parsedReturns.success) throw new ZodError_js_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
							return parsedReturns.data;
						});
					}
				}
				parameters() {
					return this._def.args;
				}
				returnType() {
					return this._def.returns;
				}
				args(...items) {
					return new ZodFunction({
						...this._def,
						args: ZodTuple.create(items).rest(ZodUnknown.create())
					});
				}
				returns(returnType) {
					return new ZodFunction({
						...this._def,
						returns: returnType
					});
				}
				implement(func) {
					return this.parse(func);
				}
				strictImplement(func) {
					return this.parse(func);
				}
				static create(args, returns, params) {
					return new ZodFunction({
						args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
						returns: returns || ZodUnknown.create(),
						typeName: ZodFirstPartyTypeKind.ZodFunction,
						...processCreateParams(params)
					});
				}
			};
			exports.ZodFunction = ZodFunction;
			var ZodLazy = class extends ZodType {
				get schema() {
					return this._def.getter();
				}
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					return this._def.getter()._parse({
						data: ctx.data,
						path: ctx.path,
						parent: ctx
					});
				}
			};
			exports.ZodLazy = ZodLazy;
			ZodLazy.create = (getter, params) => {
				return new ZodLazy({
					getter,
					typeName: ZodFirstPartyTypeKind.ZodLazy,
					...processCreateParams(params)
				});
			};
			var ZodLiteral = class extends ZodType {
				_parse(input) {
					if (input.data !== this._def.value) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							received: ctx.data,
							code: ZodError_js_1.ZodIssueCode.invalid_literal,
							expected: this._def.value
						});
						return parseUtil_js_1.INVALID;
					}
					return {
						status: "valid",
						value: input.data
					};
				}
				get value() {
					return this._def.value;
				}
			};
			exports.ZodLiteral = ZodLiteral;
			ZodLiteral.create = (value, params) => {
				return new ZodLiteral({
					value,
					typeName: ZodFirstPartyTypeKind.ZodLiteral,
					...processCreateParams(params)
				});
			};
			function createZodEnum(values, params) {
				return new ZodEnum({
					values,
					typeName: ZodFirstPartyTypeKind.ZodEnum,
					...processCreateParams(params)
				});
			}
			var ZodEnum = class ZodEnum extends ZodType {
				_parse(input) {
					if (typeof input.data !== "string") {
						const ctx = this._getOrReturnCtx(input);
						const expectedValues = this._def.values;
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							expected: util_js_1.util.joinValues(expectedValues),
							received: ctx.parsedType,
							code: ZodError_js_1.ZodIssueCode.invalid_type
						});
						return parseUtil_js_1.INVALID;
					}
					if (!this._cache) this._cache = new Set(this._def.values);
					if (!this._cache.has(input.data)) {
						const ctx = this._getOrReturnCtx(input);
						const expectedValues = this._def.values;
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							received: ctx.data,
							code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
							options: expectedValues
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
				get options() {
					return this._def.values;
				}
				get enum() {
					const enumValues = {};
					for (const val of this._def.values) enumValues[val] = val;
					return enumValues;
				}
				get Values() {
					const enumValues = {};
					for (const val of this._def.values) enumValues[val] = val;
					return enumValues;
				}
				get Enum() {
					const enumValues = {};
					for (const val of this._def.values) enumValues[val] = val;
					return enumValues;
				}
				extract(values, newDef = this._def) {
					return ZodEnum.create(values, {
						...this._def,
						...newDef
					});
				}
				exclude(values, newDef = this._def) {
					return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
						...this._def,
						...newDef
					});
				}
			};
			exports.ZodEnum = ZodEnum;
			ZodEnum.create = createZodEnum;
			var ZodNativeEnum = class extends ZodType {
				_parse(input) {
					const nativeEnumValues = util_js_1.util.getValidEnumValues(this._def.values);
					const ctx = this._getOrReturnCtx(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.string && ctx.parsedType !== util_js_1.ZodParsedType.number) {
						const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							expected: util_js_1.util.joinValues(expectedValues),
							received: ctx.parsedType,
							code: ZodError_js_1.ZodIssueCode.invalid_type
						});
						return parseUtil_js_1.INVALID;
					}
					if (!this._cache) this._cache = new Set(util_js_1.util.getValidEnumValues(this._def.values));
					if (!this._cache.has(input.data)) {
						const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							received: ctx.data,
							code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
							options: expectedValues
						});
						return parseUtil_js_1.INVALID;
					}
					return (0, parseUtil_js_1.OK)(input.data);
				}
				get enum() {
					return this._def.values;
				}
			};
			exports.ZodNativeEnum = ZodNativeEnum;
			ZodNativeEnum.create = (values, params) => {
				return new ZodNativeEnum({
					values,
					typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
					...processCreateParams(params)
				});
			};
			var ZodPromise = class extends ZodType {
				unwrap() {
					return this._def.type;
				}
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					if (ctx.parsedType !== util_js_1.ZodParsedType.promise && ctx.common.async === false) {
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.promise,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					const promisified = ctx.parsedType === util_js_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
					return (0, parseUtil_js_1.OK)(promisified.then((data) => {
						return this._def.type.parseAsync(data, {
							path: ctx.path,
							errorMap: ctx.common.contextualErrorMap
						});
					}));
				}
			};
			exports.ZodPromise = ZodPromise;
			ZodPromise.create = (schema, params) => {
				return new ZodPromise({
					type: schema,
					typeName: ZodFirstPartyTypeKind.ZodPromise,
					...processCreateParams(params)
				});
			};
			var ZodEffects = class extends ZodType {
				innerType() {
					return this._def.schema;
				}
				sourceType() {
					return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
				}
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					const effect = this._def.effect || null;
					const checkCtx = {
						addIssue: (arg) => {
							(0, parseUtil_js_1.addIssueToContext)(ctx, arg);
							if (arg.fatal) status.abort();
							else status.dirty();
						},
						get path() {
							return ctx.path;
						}
					};
					checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
					if (effect.type === "preprocess") {
						const processed = effect.transform(ctx.data, checkCtx);
						if (ctx.common.async) return Promise.resolve(processed).then(async (processed) => {
							if (status.value === "aborted") return parseUtil_js_1.INVALID;
							const result = await this._def.schema._parseAsync({
								data: processed,
								path: ctx.path,
								parent: ctx
							});
							if (result.status === "aborted") return parseUtil_js_1.INVALID;
							if (result.status === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
							if (status.value === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
							return result;
						});
						else {
							if (status.value === "aborted") return parseUtil_js_1.INVALID;
							const result = this._def.schema._parseSync({
								data: processed,
								path: ctx.path,
								parent: ctx
							});
							if (result.status === "aborted") return parseUtil_js_1.INVALID;
							if (result.status === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
							if (status.value === "dirty") return (0, parseUtil_js_1.DIRTY)(result.value);
							return result;
						}
					}
					if (effect.type === "refinement") {
						const executeRefinement = (acc) => {
							const result = effect.refinement(acc, checkCtx);
							if (ctx.common.async) return Promise.resolve(result);
							if (result instanceof Promise) throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
							return acc;
						};
						if (ctx.common.async === false) {
							const inner = this._def.schema._parseSync({
								data: ctx.data,
								path: ctx.path,
								parent: ctx
							});
							if (inner.status === "aborted") return parseUtil_js_1.INVALID;
							if (inner.status === "dirty") status.dirty();
							executeRefinement(inner.value);
							return {
								status: status.value,
								value: inner.value
							};
						} else return this._def.schema._parseAsync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						}).then((inner) => {
							if (inner.status === "aborted") return parseUtil_js_1.INVALID;
							if (inner.status === "dirty") status.dirty();
							return executeRefinement(inner.value).then(() => {
								return {
									status: status.value,
									value: inner.value
								};
							});
						});
					}
					if (effect.type === "transform") {
						if (ctx.common.async === false) {
							const base = this._def.schema._parseSync({
								data: ctx.data,
								path: ctx.path,
								parent: ctx
							});
							if (!(0, parseUtil_js_1.isValid)(base)) return parseUtil_js_1.INVALID;
							const result = effect.transform(base.value, checkCtx);
							if (result instanceof Promise) throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
							return {
								status: status.value,
								value: result
							};
						} else return this._def.schema._parseAsync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						}).then((base) => {
							if (!(0, parseUtil_js_1.isValid)(base)) return parseUtil_js_1.INVALID;
							return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
								status: status.value,
								value: result
							}));
						});
					}
					util_js_1.util.assertNever(effect);
				}
			};
			exports.ZodEffects = ZodEffects;
			exports.ZodTransformer = ZodEffects;
			ZodEffects.create = (schema, effect, params) => {
				return new ZodEffects({
					schema,
					typeName: ZodFirstPartyTypeKind.ZodEffects,
					effect,
					...processCreateParams(params)
				});
			};
			ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
				return new ZodEffects({
					schema,
					effect: {
						type: "preprocess",
						transform: preprocess
					},
					typeName: ZodFirstPartyTypeKind.ZodEffects,
					...processCreateParams(params)
				});
			};
			var ZodOptional = class extends ZodType {
				_parse(input) {
					if (this._getType(input) === util_js_1.ZodParsedType.undefined) return (0, parseUtil_js_1.OK)(void 0);
					return this._def.innerType._parse(input);
				}
				unwrap() {
					return this._def.innerType;
				}
			};
			exports.ZodOptional = ZodOptional;
			ZodOptional.create = (type, params) => {
				return new ZodOptional({
					innerType: type,
					typeName: ZodFirstPartyTypeKind.ZodOptional,
					...processCreateParams(params)
				});
			};
			var ZodNullable = class extends ZodType {
				_parse(input) {
					if (this._getType(input) === util_js_1.ZodParsedType.null) return (0, parseUtil_js_1.OK)(null);
					return this._def.innerType._parse(input);
				}
				unwrap() {
					return this._def.innerType;
				}
			};
			exports.ZodNullable = ZodNullable;
			ZodNullable.create = (type, params) => {
				return new ZodNullable({
					innerType: type,
					typeName: ZodFirstPartyTypeKind.ZodNullable,
					...processCreateParams(params)
				});
			};
			var ZodDefault = class extends ZodType {
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					let data = ctx.data;
					if (ctx.parsedType === util_js_1.ZodParsedType.undefined) data = this._def.defaultValue();
					return this._def.innerType._parse({
						data,
						path: ctx.path,
						parent: ctx
					});
				}
				removeDefault() {
					return this._def.innerType;
				}
			};
			exports.ZodDefault = ZodDefault;
			ZodDefault.create = (type, params) => {
				return new ZodDefault({
					innerType: type,
					typeName: ZodFirstPartyTypeKind.ZodDefault,
					defaultValue: typeof params.default === "function" ? params.default : () => params.default,
					...processCreateParams(params)
				});
			};
			var ZodCatch = class extends ZodType {
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					const newCtx = {
						...ctx,
						common: {
							...ctx.common,
							issues: []
						}
					};
					const result = this._def.innerType._parse({
						data: newCtx.data,
						path: newCtx.path,
						parent: { ...newCtx }
					});
					if ((0, parseUtil_js_1.isAsync)(result)) return result.then((result) => {
						return {
							status: "valid",
							value: result.status === "valid" ? result.value : this._def.catchValue({
								get error() {
									return new ZodError_js_1.ZodError(newCtx.common.issues);
								},
								input: newCtx.data
							})
						};
					});
					else return {
						status: "valid",
						value: result.status === "valid" ? result.value : this._def.catchValue({
							get error() {
								return new ZodError_js_1.ZodError(newCtx.common.issues);
							},
							input: newCtx.data
						})
					};
				}
				removeCatch() {
					return this._def.innerType;
				}
			};
			exports.ZodCatch = ZodCatch;
			ZodCatch.create = (type, params) => {
				return new ZodCatch({
					innerType: type,
					typeName: ZodFirstPartyTypeKind.ZodCatch,
					catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
					...processCreateParams(params)
				});
			};
			var ZodNaN = class extends ZodType {
				_parse(input) {
					if (this._getType(input) !== util_js_1.ZodParsedType.nan) {
						const ctx = this._getOrReturnCtx(input);
						(0, parseUtil_js_1.addIssueToContext)(ctx, {
							code: ZodError_js_1.ZodIssueCode.invalid_type,
							expected: util_js_1.ZodParsedType.nan,
							received: ctx.parsedType
						});
						return parseUtil_js_1.INVALID;
					}
					return {
						status: "valid",
						value: input.data
					};
				}
			};
			exports.ZodNaN = ZodNaN;
			ZodNaN.create = (params) => {
				return new ZodNaN({
					typeName: ZodFirstPartyTypeKind.ZodNaN,
					...processCreateParams(params)
				});
			};
			exports.BRAND = Symbol("zod_brand");
			var ZodBranded = class extends ZodType {
				_parse(input) {
					const { ctx } = this._processInputParams(input);
					const data = ctx.data;
					return this._def.type._parse({
						data,
						path: ctx.path,
						parent: ctx
					});
				}
				unwrap() {
					return this._def.type;
				}
			};
			exports.ZodBranded = ZodBranded;
			var ZodPipeline = class ZodPipeline extends ZodType {
				_parse(input) {
					const { status, ctx } = this._processInputParams(input);
					if (ctx.common.async) {
						const handleAsync = async () => {
							const inResult = await this._def.in._parseAsync({
								data: ctx.data,
								path: ctx.path,
								parent: ctx
							});
							if (inResult.status === "aborted") return parseUtil_js_1.INVALID;
							if (inResult.status === "dirty") {
								status.dirty();
								return (0, parseUtil_js_1.DIRTY)(inResult.value);
							} else return this._def.out._parseAsync({
								data: inResult.value,
								path: ctx.path,
								parent: ctx
							});
						};
						return handleAsync();
					} else {
						const inResult = this._def.in._parseSync({
							data: ctx.data,
							path: ctx.path,
							parent: ctx
						});
						if (inResult.status === "aborted") return parseUtil_js_1.INVALID;
						if (inResult.status === "dirty") {
							status.dirty();
							return {
								status: "dirty",
								value: inResult.value
							};
						} else return this._def.out._parseSync({
							data: inResult.value,
							path: ctx.path,
							parent: ctx
						});
					}
				}
				static create(a, b) {
					return new ZodPipeline({
						in: a,
						out: b,
						typeName: ZodFirstPartyTypeKind.ZodPipeline
					});
				}
			};
			exports.ZodPipeline = ZodPipeline;
			var ZodReadonly = class extends ZodType {
				_parse(input) {
					const result = this._def.innerType._parse(input);
					const freeze = (data) => {
						if ((0, parseUtil_js_1.isValid)(data)) data.value = Object.freeze(data.value);
						return data;
					};
					return (0, parseUtil_js_1.isAsync)(result) ? result.then((data) => freeze(data)) : freeze(result);
				}
				unwrap() {
					return this._def.innerType;
				}
			};
			exports.ZodReadonly = ZodReadonly;
			ZodReadonly.create = (type, params) => {
				return new ZodReadonly({
					innerType: type,
					typeName: ZodFirstPartyTypeKind.ZodReadonly,
					...processCreateParams(params)
				});
			};
			function cleanParams(params, data) {
				const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
				return typeof p === "string" ? { message: p } : p;
			}
			function custom(check, _params = {}, fatal) {
				if (check) return ZodAny.create().superRefine((data, ctx) => {
					const r = check(data);
					if (r instanceof Promise) return r.then((r) => {
						if (!r) {
							const params = cleanParams(_params, data);
							const _fatal = params.fatal ?? fatal ?? true;
							ctx.addIssue({
								code: "custom",
								...params,
								fatal: _fatal
							});
						}
					});
					if (!r) {
						const params = cleanParams(_params, data);
						const _fatal = params.fatal ?? fatal ?? true;
						ctx.addIssue({
							code: "custom",
							...params,
							fatal: _fatal
						});
					}
				});
				return ZodAny.create();
			}
			exports.late = { object: ZodObject.lazycreate };
			var ZodFirstPartyTypeKind;
			(function(ZodFirstPartyTypeKind) {
				ZodFirstPartyTypeKind["ZodString"] = "ZodString";
				ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
				ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
				ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
				ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
				ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
				ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
				ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
				ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
				ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
				ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
				ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
				ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
				ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
				ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
				ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
				ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
				ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
				ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
				ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
				ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
				ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
				ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
				ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
				ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
				ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
				ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
				ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
				ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
				ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
				ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
				ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
				ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
				ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
				ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
				ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
			})(ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
			const instanceOfType = (cls, params = { message: `Input not instance of ${cls.name}` }) => custom((data) => data instanceof cls, params);
			exports.instanceof = instanceOfType;
			const stringType = ZodString.create;
			exports.string = stringType;
			const numberType = ZodNumber.create;
			exports.number = numberType;
			exports.nan = ZodNaN.create;
			exports.bigint = ZodBigInt.create;
			const booleanType = ZodBoolean.create;
			exports.boolean = booleanType;
			exports.date = ZodDate.create;
			exports.symbol = ZodSymbol.create;
			exports.undefined = ZodUndefined.create;
			exports.null = ZodNull.create;
			exports.any = ZodAny.create;
			exports.unknown = ZodUnknown.create;
			exports.never = ZodNever.create;
			exports.void = ZodVoid.create;
			exports.array = ZodArray.create;
			exports.object = ZodObject.create;
			exports.strictObject = ZodObject.strictCreate;
			exports.union = ZodUnion.create;
			exports.discriminatedUnion = ZodDiscriminatedUnion.create;
			exports.intersection = ZodIntersection.create;
			exports.tuple = ZodTuple.create;
			exports.record = ZodRecord.create;
			exports.map = ZodMap.create;
			exports.set = ZodSet.create;
			exports.function = ZodFunction.create;
			exports.lazy = ZodLazy.create;
			exports.literal = ZodLiteral.create;
			exports.enum = ZodEnum.create;
			exports.nativeEnum = ZodNativeEnum.create;
			exports.promise = ZodPromise.create;
			const effectsType = ZodEffects.create;
			exports.effect = effectsType;
			exports.transformer = effectsType;
			exports.optional = ZodOptional.create;
			exports.nullable = ZodNullable.create;
			exports.preprocess = ZodEffects.createWithPreprocess;
			exports.pipeline = ZodPipeline.create;
			const ostring = () => stringType().optional();
			exports.ostring = ostring;
			const onumber = () => numberType().optional();
			exports.onumber = onumber;
			const oboolean = () => booleanType().optional();
			exports.oboolean = oboolean;
			exports.coerce = {
				string: ((arg) => ZodString.create({
					...arg,
					coerce: true
				})),
				number: ((arg) => ZodNumber.create({
					...arg,
					coerce: true
				})),
				boolean: ((arg) => ZodBoolean.create({
					...arg,
					coerce: true
				})),
				bigint: ((arg) => ZodBigInt.create({
					...arg,
					coerce: true
				})),
				date: ((arg) => ZodDate.create({
					...arg,
					coerce: true
				}))
			};
			exports.NEVER = parseUtil_js_1.INVALID;
		}));
		//#endregion
		//#region node_modules/.pnpm/zod@3.25.76/node_modules/zod/v3/external.cjs
		var require_external = /* @__PURE__ */ __commonJSMin(((exports) => {
			var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
				if (k2 === void 0) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
					enumerable: true,
					get: function() {
						return m[k];
					}
				};
				Object.defineProperty(o, k2, desc);
			}) : (function(o, m, k, k2) {
				if (k2 === void 0) k2 = k;
				o[k2] = m[k];
			}));
			var __exportStar = exports && exports.__exportStar || function(m, exports$2) {
				for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$2, p)) __createBinding(exports$2, m, p);
			};
			Object.defineProperty(exports, "__esModule", { value: true });
			__exportStar(require_errors(), exports);
			__exportStar(require_parseUtil(), exports);
			__exportStar(require_typeAliases(), exports);
			__exportStar(require_util(), exports);
			__exportStar(require_types(), exports);
			__exportStar(require_ZodError(), exports);
		}));
		//#endregion
		//#region src/projection-schema.ts
		var import_zod = (/* @__PURE__ */ __commonJSMin(((exports) => {
			var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
				if (k2 === void 0) k2 = k;
				var desc = Object.getOwnPropertyDescriptor(m, k);
				if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) desc = {
					enumerable: true,
					get: function() {
						return m[k];
					}
				};
				Object.defineProperty(o, k2, desc);
			}) : (function(o, m, k, k2) {
				if (k2 === void 0) k2 = k;
				o[k2] = m[k];
			}));
			var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
				Object.defineProperty(o, "default", {
					enumerable: true,
					value: v
				});
			}) : function(o, v) {
				o["default"] = v;
			});
			var __importStar = exports && exports.__importStar || function(mod) {
				if (mod && mod.__esModule) return mod;
				var result = {};
				if (mod != null) {
					for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
				}
				__setModuleDefault(result, mod);
				return result;
			};
			var __exportStar = exports && exports.__exportStar || function(m, exports$1) {
				for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports$1, p)) __createBinding(exports$1, m, p);
			};
			Object.defineProperty(exports, "__esModule", { value: true });
			exports.z = void 0;
			const z = __importStar(require_external());
			exports.z = z;
			__exportStar(require_external(), exports);
			exports.default = z;
		})))();
		/** Durable lifecycle state of one background agent, folded from the parent log. */
		const backgroundAgentEntrySchema = import_zod.z.object({
			/** Durable child session id (the `agentId` every tool returns). */
			agentId: import_zod.z.string().min(1),
			/** Creation label persisted with the child. */
			label: import_zod.z.string(),
			/**
			* Last folded lifecycle fact: `running` while registrations/messages/progress
			* keep landing, `inactive` after the child's activation settled (folded from
			* the official `subagent-settled` notice), `archived` after the idle sweep.
			*/
			activity: import_zod.z.enum([
				"running",
				"inactive",
				"archived"
			]),
			/** Accepted deliveries to the child: the initial task plus every follow-up. */
			messageCount: import_zod.z.number().int().nonnegative(),
			/** Last progress or settle summary, when one was recorded. */
			lastMessage: import_zod.z.string().optional(),
			/** Epoch ms of the registration fact. */
			createdAt: import_zod.z.number().int().nonnegative(),
			/** Epoch ms of the last folded fact for this agent. */
			lastActiveAt: import_zod.z.number().int().nonnegative(),
			/** Epoch ms of the idle-sweep archive fact, when the row is parked. */
			archivedAt: import_zod.z.number().int().nonnegative().optional(),
			/** Epoch ms of the latest interrupt request, when one was recorded. */
			stopRequestedAt: import_zod.z.number().int().nonnegative().optional()
		}).strict();
		/** The whole wire value of the `backgroundAgents` projection unit. */
		const backgroundAgentsSchema = import_zod.z.object({ agents: import_zod.z.array(backgroundAgentEntrySchema) }).strict();
		/**
		* Guard an opaque projection value (the client reads projection cells as
		* unknown because it cannot merge the host's `SessionProjectionMap`).
		* @param value - the opaque cell value.
		* @returns the typed projection, or undefined when the cell is absent or invalid.
		*/
		function isBackgroundAgentsProjection(value) {
			const parsed = backgroundAgentsSchema.safeParse(value);
			return parsed.success ? parsed.data : void 0;
		}
		//#endregion
		//#region src/client/presenter.ts
		/**
		* Pure presentation of background-agent dashboard rows. The presenter reads
		* only the session-list snapshot (each parent summary carries its
		* `backgroundAgents` projection value) and derives every displayed fact —
		* no I/O, clock, or randomness — so the rows are testable and the component
		* stays a thin binder.
		*
		* @module dsh-background-agents/presenter
		*/
		/** Read the plugin's projection cell out of the opaque client projection map. */
		function cellOf(parent) {
			return parent.projectionValues?.backgroundAgents;
		}
		/**
		* Overlay the durable lifecycle fact with the live running bit. The client
		* list cannot distinguish a live-but-idle child from a cold one, so both read
		* `idle`; `bg_list` refines with the host agent registry.
		* @param entry - the folded projection entry.
		* @param liveRunning - whether the child session's driver is running now.
		* @returns the display status.
		*/
		function rowStatus(entry, liveRunning) {
			if (entry.activity === "archived") return "archived";
			if (liveRunning) return "running";
			if (entry.activity === "inactive") return "settled";
			return "idle";
		}
		/**
		* Build every dashboard row from one session-list snapshot, ordered by
		* registration time (oldest first) with the id as tiebreak.
		* @param list - the session-list snapshot.
		* @returns the dashboard rows; empty when no session projects agents.
		*/
		function buildAgentRows(list) {
			const rows = [];
			for (const parent of Object.values(list.byId)) {
				const projection = isBackgroundAgentsProjection(cellOf(parent));
				if (projection === void 0) continue;
				for (const entry of projection.agents) {
					const child = list.byId[entry.agentId];
					rows.push({
						parentSessionId: parent.id,
						agentId: entry.agentId,
						label: entry.label === "" ? child?.displayTitle ?? entry.agentId : entry.label,
						...parent.displayTitle === void 0 ? {} : { parentTitle: parent.displayTitle },
						status: rowStatus(entry, child?.running === true),
						messageCount: entry.messageCount,
						...entry.lastMessage === void 0 ? {} : { lastMessage: entry.lastMessage },
						createdAt: entry.createdAt,
						lastActiveAt: entry.lastActiveAt
					});
				}
			}
			rows.sort((a, b) => a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : a.agentId < b.agentId ? -1 : 1);
			return rows;
		}
		/**
		* Compact relative time for a row's `lastActiveAt`.
		* @param at - epoch ms of the last activity.
		* @param now - epoch ms now (injected for purity).
		* @returns the bucket and magnitude.
		*/
		function relativeTime(at, now) {
			const MIN = 6e4;
			const HOUR = 36e5;
			const DAY = 864e5;
			const diff = Math.max(0, now - at);
			if (diff < MIN) return {
				unit: "now",
				n: 0
			};
			if (diff < HOUR) return {
				unit: "minutes",
				n: Math.floor(diff / MIN)
			};
			if (diff < DAY) return {
				unit: "hours",
				n: Math.floor(diff / HOUR)
			};
			if (diff < 30 * DAY) return {
				unit: "days",
				n: Math.floor(diff / DAY)
			};
			if (diff < 365 * DAY) return {
				unit: "months",
				n: Math.floor(diff / (30 * DAY))
			};
			return {
				unit: "years",
				n: Math.floor(diff / (365 * DAY))
			};
		}
		/**
		* Extract the final assistant text from one history page. Scans forward for
		* the last assistant message that carries a text block; reasoning-only
		* messages are skipped (bg_result owns the reasoning fallback, the panel
		* shows plain text). Returns '' when the page has none — the caller renders
		* its own empty state.
		* @param entries - one `subagent.history` page's entries.
		* @returns the joined text of the last assistant text message.
		*/
		function extractResultText(entries) {
			let text = "";
			for (const entry of entries) {
				if (entry.event.type !== "assistant/message") continue;
				const message = entry.event.data?.message;
				if (message === void 0 || !Array.isArray(message.content)) continue;
				const joined = message.content.filter((block) => typeof block === "object" && block !== null && block.type === "text").map((block) => block.text).join("").trim();
				if (joined !== "") text = joined;
			}
			return text;
		}
		//#endregion
		//#region \0dsh-bg-css:src/client/BackgroundAgentsAction.module.css.mjs
		const css = ".fCmbna_triggerWrap{justify-content:center;display:flex;position:relative}.fCmbna_trigger{height:32px;color:inherit;cursor:pointer;background:0 0;border:none;border-radius:6px;align-items:center;gap:6px;padding:0 8px;display:flex}.fCmbna_trigger:hover{background:var(--color-bg-hover,#8080801f)}.fCmbna_triggerIcon{font-size:12px;line-height:1}.fCmbna_triggerLabel{white-space:nowrap;font-size:12px}.fCmbna_count{background:var(--color-accent,light-dark(#4d6bfe,#5d7aff));color:#fff;text-align:center;border-radius:8px;min-width:16px;padding:0 4px;font-size:10px;line-height:16px}.fCmbna_panel{z-index:1000;border:1px solid var(--color-border,#8080803d);background:var(--color-bg-elevated,light-dark(#fff,#1e1e1e));border-radius:10px;outline:none;width:320px;max-height:60vh;padding:12px;position:fixed;bottom:64px;right:16px;overflow-y:auto;box-shadow:0 8px 32px #0000002e}.fCmbna_panelTitle{margin-bottom:8px;font-size:13px;font-weight:600}.fCmbna_empty{opacity:.7;padding:12px 0;font-size:12px}.fCmbna_error{color:light-dark(#c92a2a,#ff8f8f);background:light-dark(#c92a2a1f,#ff87871f);border-radius:6px;margin-bottom:8px;padding:6px 8px;font-size:12px}.fCmbna_rows{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.fCmbna_row{border:1px solid var(--color-border,#8080803d);border-radius:8px;padding:8px}.fCmbna_rowHead{align-items:center;gap:6px;display:flex}.fCmbna_status{white-space:nowrap;border-radius:8px;flex:none;padding:1px 6px;font-size:10px;line-height:16px}.fCmbna_status-running{color:light-dark(#4d6bfe,#7c9bff);background:light-dark(#4d6bfe24,#5d7aff24)}.fCmbna_status-idle{color:inherit;background:#80808029}.fCmbna_status-settled{color:light-dark(#2cac52,#6fd48f);background:light-dark(#2cac5224,#5fce8324)}.fCmbna_status-archived{color:light-dark(#e69138,#f2b269);background:light-dark(#e6913824,#f2b26924)}.fCmbna_label{text-overflow:ellipsis;white-space:nowrap;flex:auto;font-size:12px;overflow:hidden}.fCmbna_parentTitle{opacity:.6;text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:10px;overflow:hidden}.fCmbna_meta{opacity:.7;flex:none;font-size:10px}.fCmbna_lastMessage{opacity:.85;text-overflow:ellipsis;white-space:nowrap;margin-top:4px;font-size:11px;overflow:hidden}.fCmbna_result{background:var(--color-bg-hover,#80808014);border-radius:6px;margin-top:6px;padding:6px 8px}.fCmbna_resultText{white-space:pre-wrap;word-break:break-word;max-height:160px;font-size:11px;line-height:1.5;overflow-y:auto}.fCmbna_resultLoading{opacity:.7;font-size:11px}.fCmbna_resultError{color:light-dark(#c92a2a,#ff8f8f);font-size:11px}.fCmbna_actions{gap:6px;margin-top:6px;display:flex}.fCmbna_action{border:1px solid var(--color-border,#8080803d);color:inherit;cursor:pointer;background:0 0;border-radius:6px;padding:3px 10px;font-size:11px}.fCmbna_action:hover:not(:disabled){background:var(--color-bg-hover,#8080801f)}.fCmbna_action:disabled{opacity:.5;cursor:default}.fCmbna_composer{gap:6px;margin-top:6px;display:flex}.fCmbna_composerInput{border:1px solid var(--color-border,#8080803d);min-width:0;color:inherit;background:0 0;border-radius:6px;flex:auto;padding:3px 8px;font-size:11px}";
		const tagId = "dsh-background-agents/BackgroundAgentsAction.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-background-agents";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var BackgroundAgentsAction_module_css_default = {
			"action": "fCmbna_action",
			"actions": "fCmbna_actions",
			"composer": "fCmbna_composer",
			"composerInput": "fCmbna_composerInput",
			"count": "fCmbna_count",
			"empty": "fCmbna_empty",
			"error": "fCmbna_error",
			"label": "fCmbna_label",
			"lastMessage": "fCmbna_lastMessage",
			"meta": "fCmbna_meta",
			"panel": "fCmbna_panel",
			"panelTitle": "fCmbna_panelTitle",
			"parentTitle": "fCmbna_parentTitle",
			"result": "fCmbna_result",
			"resultError": "fCmbna_resultError",
			"resultLoading": "fCmbna_resultLoading",
			"resultText": "fCmbna_resultText",
			"row": "fCmbna_row",
			"rowHead": "fCmbna_rowHead",
			"rows": "fCmbna_rows",
			"status": "fCmbna_status",
			"status-archived": "fCmbna_status-archived",
			"status-idle": "fCmbna_status-idle",
			"status-running": "fCmbna_status-running",
			"status-settled": "fCmbna_status-settled",
			"trigger": "fCmbna_trigger",
			"triggerIcon": "fCmbna_triggerIcon",
			"triggerLabel": "fCmbna_triggerLabel",
			"triggerWrap": "fCmbna_triggerWrap"
		};
		//#endregion
		//#region src/client/BackgroundAgentsAction.tsx
		/**
		* The sidebar background-agent panel: a `sidebar.footer.action` entry whose
		* trigger shows a live agent count and opens a floating panel of dashboard
		* rows (label, status, last activity, message count) with one-click
		* jump-to-child-session and stop. All displayed facts come from the pure
		* presenter over the session-list snapshot; this component only binds
		* interactions.
		*/
		/** Localized relative-time label for one row. */
		function timeLabel(at, now, t) {
			const rel = relativeTime(at, now);
			switch (rel.unit) {
				case "now": return t("time.now");
				case "minutes": return t("time.minutes", { n: rel.n });
				case "hours": return t("time.hours", { n: rel.n });
				case "days": return t("time.days", { n: rel.n });
				case "months": return t("time.months", { n: rel.n });
				case "years": return t("time.years", { n: rel.n });
			}
		}
		/** Localized status label. */
		function statusLabel(status, t) {
			switch (status) {
				case "running": return t("status.running");
				case "idle": return t("status.idle");
				case "settled": return t("status.settled");
				case "archived": return t("status.archived");
			}
		}
		/** One dashboard row. */
		function Row({ row, t, now, busy, showParent, composing, draft, result, onResult, onCloseResult, onDraft, onOpen, onStop, onCompose, onSend, onCancel }) {
			const resultOpen = result !== void 0 && result.id === row.agentId;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("li", {
				className: BackgroundAgentsAction_module_css_default.row,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BackgroundAgentsAction_module_css_default.rowHead,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: `${BackgroundAgentsAction_module_css_default.status} ${BackgroundAgentsAction_module_css_default[`status-${row.status}`]}`,
								children: statusLabel(row.status, t)
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: BackgroundAgentsAction_module_css_default.label,
								title: row.agentId,
								children: row.label
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: BackgroundAgentsAction_module_css_default.meta,
								children: [
									t("row.messages", { n: row.messageCount }),
									" · ",
									timeLabel(row.lastActiveAt, now, t)
								]
							})
						]
					}),
					showParent && row.parentTitle !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: BackgroundAgentsAction_module_css_default.parentTitle,
						children: row.parentTitle
					}),
					row.lastMessage !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
						className: BackgroundAgentsAction_module_css_default.lastMessage,
						children: row.lastMessage
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BackgroundAgentsAction_module_css_default.actions,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy,
								onClick: onOpen,
								children: t("row.open")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy || row.status === "archived",
								onClick: onStop,
								children: t("row.stop")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy || composing,
								onClick: onCompose,
								children: t("row.message")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy,
								onClick: resultOpen ? onCloseResult : onResult,
								children: resultOpen ? t("result.close") : t("row.result")
							})
						]
					}),
					resultOpen && result !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BackgroundAgentsAction_module_css_default.result,
						children: [
							result.loading && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: BackgroundAgentsAction_module_css_default.resultLoading,
								children: t("result.loading")
							}),
							!result.loading && result.error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: BackgroundAgentsAction_module_css_default.resultError,
								children: result.error
							}),
							!result.loading && result.error === void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: BackgroundAgentsAction_module_css_default.resultText,
								children: result.text === "" ? t("result.empty") : result.text
							})
						]
					}),
					composing && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: BackgroundAgentsAction_module_css_default.composer,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: BackgroundAgentsAction_module_css_default.composerInput,
								value: draft,
								placeholder: t("message.placeholder"),
								onChange: (event) => {
									onDraft(event.target.value);
								},
								onKeyDown: (event) => {
									if (event.key === "Enter" && draft.trim() !== "" && !busy) onSend();
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy || draft.trim() === "",
								onClick: onSend,
								children: t("message.send")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BackgroundAgentsAction_module_css_default.action,
								disabled: busy,
								onClick: onCancel,
								children: t("message.cancel")
							})
						]
					})
				]
			});
		}
		/** The sidebar footer trigger + floating dashboard panel. */
		function BackgroundAgentsAction({ wide, t, useSessions, openChild, stopChild, sendMessage, readResult }) {
			const [open, setOpen] = (0, react.useState)(false);
			const [error, setError] = (0, react.useState)(void 0);
			const [busyId, setBusyId] = (0, react.useState)(void 0);
			const [composingId, setComposingId] = (0, react.useState)(void 0);
			const [draft, setDraft] = (0, react.useState)("");
			const [result, setResult] = (0, react.useState)(void 0);
			const [now, setNow] = (0, react.useState)(() => Date.now());
			const wrapRef = (0, react.useRef)(null);
			const panelRef = (0, react.useRef)(null);
			const triggerRef = (0, react.useRef)(null);
			const wasOpenRef = (0, react.useRef)(false);
			const rows = useSessions((snapshot) => buildAgentRows(snapshot));
			const runningCount = rows.filter((row) => row.status === "running").length;
			const showParent = new Set(rows.map((row) => row.parentSessionId)).size > 1;
			(0, react.useEffect)(() => {
				if (!open) return;
				const timer = window.setInterval(() => {
					setNow(Date.now());
				}, 3e4);
				return () => {
					window.clearInterval(timer);
				};
			}, [open]);
			(0, react.useEffect)(() => {
				if (open) panelRef.current?.focus();
				else if (wasOpenRef.current) triggerRef.current?.focus();
				wasOpenRef.current = open;
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const onDown = (event) => {
					const target = event.target;
					if (!(target instanceof Node)) return;
					if (panelRef.current?.contains(target) === true || wrapRef.current?.contains(target) === true) return;
					setOpen(false);
				};
				const onKey = (event) => {
					if (event.key === "Escape") setOpen(false);
				};
				document.addEventListener("pointerdown", onDown);
				document.addEventListener("keydown", onKey);
				return () => {
					document.removeEventListener("pointerdown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [open]);
			const run = async (action, row) => {
				setBusyId(row.agentId);
				setError(void 0);
				try {
					const failure = await action(row);
					setError(failure);
				} finally {
					setBusyId(void 0);
				}
			};
			const loadResult = async (row) => {
				setResult({
					id: row.agentId,
					loading: true,
					text: ""
				});
				setError(void 0);
				try {
					const peek = await readResult(row.parentSessionId, row.agentId);
					setResult({
						id: row.agentId,
						loading: false,
						text: peek.text,
						...peek.error === void 0 ? {} : { error: peek.error }
					});
				} catch (failure) {
					setResult({
						id: row.agentId,
						loading: false,
						text: "",
						error: failure instanceof Error ? failure.message : String(failure)
					});
				}
			};
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: BackgroundAgentsAction_module_css_default.triggerWrap,
				ref: wrapRef,
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label: t("trigger.aria"),
					delayMs: 500,
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						ref: triggerRef,
						className: BackgroundAgentsAction_module_css_default.trigger,
						"aria-label": t("trigger.aria"),
						"aria-expanded": open,
						onClick: () => {
							setOpen((value) => !value);
							setError(void 0);
						},
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: BackgroundAgentsAction_module_css_default.triggerIcon,
								"aria-hidden": true,
								children: "◉"
							}),
							wide && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: BackgroundAgentsAction_module_css_default.triggerLabel,
								children: t("trigger.label")
							}),
							runningCount > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: BackgroundAgentsAction_module_css_default.count,
								children: runningCount
							})
						]
					})
				}), open && (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					className: BackgroundAgentsAction_module_css_default.panel,
					role: "dialog",
					"aria-label": t("panel.title"),
					ref: panelRef,
					tabIndex: -1,
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: BackgroundAgentsAction_module_css_default.panelTitle,
							children: t("panel.title")
						}),
						error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: BackgroundAgentsAction_module_css_default.error,
							children: error
						}),
						rows.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: BackgroundAgentsAction_module_css_default.empty,
							children: t("panel.empty")
						}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("ul", {
							className: BackgroundAgentsAction_module_css_default.rows,
							children: rows.map((row) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)(Row, {
								row,
								t,
								now,
								busy: busyId === row.agentId,
								showParent,
								composing: composingId === row.agentId,
								draft: composingId === row.agentId ? draft : "",
								result,
								onResult: () => {
									loadResult(row);
								},
								onCloseResult: () => {
									setResult(void 0);
								},
								onDraft: setDraft,
								onOpen: () => {
									run((next) => openChild(next.parentSessionId, next.agentId), row);
								},
								onStop: () => {
									run((next) => stopChild(next.parentSessionId, next.agentId), row);
								},
								onCompose: () => {
									setComposingId(row.agentId);
									setDraft("");
									setError(void 0);
								},
								onSend: () => {
									const text = draft.trim();
									if (text === "") return;
									run(async (next) => {
										const failure = await sendMessage(next.parentSessionId, next.agentId, text);
										if (failure === void 0) setComposingId(void 0);
										return failure;
									}, row);
								},
								onCancel: () => {
									setComposingId(void 0);
								}
							}, row.agentId))
						})
					]
				}), document.body)]
			});
		}
		//#endregion
		//#region src/client/locales.ts
		/** `background-agents` namespace dictionaries. */
		/** Dictionary namespace owned by this plugin. */
		const NS = "background-agents";
		/** Simplified Chinese dictionary (the key-set source of truth). */
		const zh = {
			"trigger.label": "后台 agent",
			"trigger.aria": "查看后台 agent",
			"panel.title": "后台 agent",
			"panel.empty": "暂无后台 agent —— 用 background_agent 工具启动一个",
			"status.running": "运行中",
			"status.idle": "待命",
			"status.settled": "已结束",
			"status.archived": "已归档",
			"row.open": "打开会话",
			"row.stop": "停止",
			"row.message": "发消息",
			"row.result": "查看结果",
			"row.messages": "{n} 条消息",
			"result.loading": "加载中…",
			"result.empty": "该 agent 还没有输出文本",
			"result.close": "收起",
			"message.placeholder": "发给该 agent 的消息…",
			"message.send": "发送",
			"message.cancel": "取消",
			"time.now": "刚刚",
			"time.minutes": "{n} 分钟前",
			"time.hours": "{n} 小时前",
			"time.days": "{n} 天前",
			"time.months": "{n} 个月前",
			"time.years": "{n} 年前"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"trigger.label": "Background agents",
			"trigger.aria": "View background agents",
			"panel.title": "Background agents",
			"panel.empty": "No background agents — start one with the background_agent tool",
			"status.running": "running",
			"status.idle": "idle",
			"status.settled": "settled",
			"status.archived": "archived",
			"row.open": "Open",
			"row.stop": "Stop",
			"row.message": "Message",
			"row.result": "Result",
			"row.messages": "{n} messages",
			"result.loading": "Loading…",
			"result.empty": "This agent has no output text yet",
			"result.close": "Close",
			"message.placeholder": "Message for this agent…",
			"message.send": "Send",
			"message.cancel": "Cancel",
			"time.now": "now",
			"time.minutes": "{n}m ago",
			"time.hours": "{n}h ago",
			"time.days": "{n}d ago",
			"time.months": "{n}mo ago",
			"time.years": "{n}y ago"
		};
		//#endregion
		//#region src/client/index.ts
		/** Required services: sessions (list + subagent navigation), slots, locale, and the wire client. */
		const inject = [
			"sessions",
			"slots",
			"locale",
			"connection"
		];
		/**
		* Register the background-agent panel into the sidebar footer.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "dsh-background-agents: dictionaries");
			const sessions = ctx.get("sessions");
			const { api } = ctx.get("connection");
			ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
				name: "sidebar.footer.action",
				id: "background-agents",
				order: 0,
				locale: NS,
				inject: () => ({
					async openChild(parentSessionId, childSessionId) {
						try {
							await sessions.refreshSubagents(parentSessionId);
							sessions.openSubagent({
								parentSessionId,
								childSessionId,
								mode: "continuable"
							});
							return;
						} catch (error) {
							return error instanceof Error ? error.message : String(error);
						}
					},
					async stopChild(parentSessionId, childSessionId) {
						try {
							const result = await api.subagents.interrupt({
								parentSessionId,
								childSessionId,
								mode: "continuable"
							});
							if (result.result.ok) return void 0;
							return `${result.result.error.code}: ${result.result.error.message}`;
						} catch (error) {
							return error instanceof Error ? error.message : String(error);
						}
					},
					async sendMessage(parentSessionId, childSessionId, text) {
						try {
							const result = await api.subagents.prompt({
								parentSessionId,
								childSessionId,
								mode: "continuable",
								content: [{
									type: "text",
									text
								}],
								clientTimeZone: new Intl.DateTimeFormat().resolvedOptions().timeZone
							});
							if (result.result.ok) return void 0;
							return `${result.result.error.code}: ${result.result.error.message}`;
						} catch (error) {
							return error instanceof Error ? error.message : String(error);
						}
					},
					async readResult(parentSessionId, childSessionId) {
						try {
							const result = await api.subagents.history({
								parentSessionId,
								childSessionId,
								mode: "continuable",
								maxMessages: 4
							});
							if (!result.result.ok) return {
								text: "",
								error: `${result.result.error.code}: ${result.result.error.message}`
							};
							return { text: extractResultText(result.result.value.events) };
						} catch (error) {
							return {
								text: "",
								error: error instanceof Error ? error.message : String(error)
							};
						}
					}
				})
			}, BackgroundAgentsAction));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map