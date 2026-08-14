import Schema from "@deepseek-ai/schemastery";
import { boundContextSummary, createUserMessage } from "@deepseek-ai/dsh-llm";
import { SubagentError, finalAssistantOutput } from "@deepseek-ai/dsh-subagent";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { SessionId } from "@deepseek-ai/dsh-session";
//#region \0rolldown/runtime.js
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
//#endregion
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
	lastActiveAt: import_zod.z.number().int().nonnegative()
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
//#region src/vocabulary.ts
/**
* Durable vocabulary of dsh-background-agents: the canonical notice-line
* format carried by model-visible injections and the replay metadata the
* four tools attach to their `tool/result` events. Both channels use ONLY
* event types the harness already knows (`user/message`, `tool/result`), so
* the facts survive persistence reloads and the `backgroundAgents`
* projection folds them back out of the parent log — the same discipline as
* model-visible ⟺ logged, applied to dashboard state.
*
* @module dsh-background-agents/vocabulary
*/
/** The producer tag stamped on every model-visible notice and replay meta this plugin writes. */
const PLUGIN = "dsh-background-agents";
/** Prefix that opens every injected notice line, carrying the durable child agent id. */
const NOTICE_PREFIX = "[background-agent ";
/**
* Join one injected notice line from the child id, the fact kind, and the
* human text. The projection folds the line back apart; the model reads the
* whole line verbatim.
* @param agentId - durable child session id.
* @param kind - which lifecycle fact the line states.
* @param text - human-readable account.
* @returns the canonical notice line.
*/
function noticeLine(agentId, kind, text) {
	return `${NOTICE_PREFIX}${agentId}] ${kind}: ${text}`;
}
/**
* Parse the canonical notice head. Returns undefined for any line this
* plugin did not produce, so foreign plugin notices never fold into the
* projection.
* @param text - one injected notice line.
* @returns the head, or undefined when the line is not this plugin's format.
*/
function parseNotice(text) {
	if (!text.startsWith("[background-agent ")) return void 0;
	const close = text.indexOf("]", 18);
	if (close === -1) return void 0;
	const agentId = text.slice(18, close);
	if (agentId === "") return void 0;
	const rest = text.slice(close + 1);
	if (rest.startsWith(" progress: ")) return {
		agentId,
		kind: "progress",
		text: rest.slice(11)
	};
	if (rest.startsWith(" archived: ")) return {
		agentId,
		kind: "archived",
		text: rest.slice(11)
	};
}
/**
* Runtime-guard one opaque `tool/result.meta` value as this plugin's metadata.
* The meta channel is tool-private JSON, so the projection validates before
* folding rather than trusting shape by position.
* @param value - the opaque meta value.
* @returns the typed meta, or undefined when another tool wrote it.
*/
function isBackgroundAgentsMeta(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return void 0;
	const candidate = value;
	if (candidate.plugin !== "dsh-background-agents") return void 0;
	if (typeof candidate.agentId !== "string" || candidate.agentId === "") return void 0;
	switch (candidate.action) {
		case "registered": return typeof candidate.label === "string" ? {
			plugin: PLUGIN,
			action: "registered",
			agentId: candidate.agentId,
			label: candidate.label
		} : void 0;
		case "message": return typeof candidate.messageId === "string" ? {
			plugin: PLUGIN,
			action: "message",
			agentId: candidate.agentId,
			messageId: candidate.messageId
		} : void 0;
		case "stop": return {
			plugin: PLUGIN,
			action: "stop",
			agentId: candidate.agentId
		};
		default: return;
	}
}
//#endregion
//#region src/lifecycle.ts
/**
* The in-memory tracked-children registry.
*/
var BackgroundAgentLifecycle = class {
	children = /* @__PURE__ */ new Map();
	/** Track one accepted child, replacing any stale record under the same id. */
	register(childId, parentSessionId, label, now) {
		const existing = this.children.get(childId);
		this.children.set(childId, {
			childId,
			parentSessionId,
			label: label === "" ? existing?.label ?? "" : label,
			createdAt: existing?.createdAt ?? now,
			lastActivityAt: now,
			lastReportAt: existing?.lastReportAt ?? -1,
			archived: false
		});
	}
	/** Record one observed child-session event. */
	touch(childId, at) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.lastActivityAt = at;
	}
	/** Record one emitted progress report (throttle watermark). */
	noteReport(childId, at) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.lastReportAt = at;
	}
	/** Mark archived; archived children leave the live observation set. */
	archive(childId) {
		const child = this.children.get(childId);
		if (child === void 0) return;
		child.archived = true;
	}
	/** Drop a stale cache entry (the parent log keeps the durable facts). */
	delete(childId) {
		this.children.delete(childId);
	}
	get(childId) {
		return this.children.get(childId);
	}
	has(childId) {
		return this.children.has(childId);
	}
	/** Live non-archived children of one parent, in registration order. */
	activeFor(parentSessionId) {
		return [...this.children.values()].filter((child) => !child.archived && child.parentSessionId === parentSessionId);
	}
	/** Every tracked child, archived included (the sweep iterates this). */
	all() {
		return [...this.children.values()];
	}
	/** Live non-archived count for one parent (the fallback cap when listing fails). */
	activeCountFor(parentSessionId) {
		return this.activeFor(parentSessionId).length;
	}
};
/**
* One line of a session's last assistant text, empty when it produced none.
* Accepts any event-log carrier so both live sessions and persistence
* inspections can serve the same fold.
*/
function sessionLastText(session) {
	const output = finalAssistantOutput(session.events);
	if (output === void 0) return "";
	return output.filter((block) => block.type === "text").map((block) => block.text).join("").trim();
}
/** One line of the child's last assistant text, empty when it produced none. */
function childLastText(sessions, childId) {
	const session = sessions.get(childId);
	if (session === void 0) return "";
	return sessionLastText(session);
}
/** Bound one line to the configured report cap with an explicit ellipsis. */
function boundLine(line, max) {
	const trimmed = line.replaceAll(/\s+/g, " ").trim();
	return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}
/**
* Report one completed child turn into the parent: a model-visible injected
* notice (source `{ kind: 'plugin', plugin: 'dsh-background-agents' }`) whose
* canonical prefix lets the projection fold the durable fact back out of the
* parent log. Honours the per-child throttle and the parent's presence.
* `wakeup` delivery starts a parent turn through `Agent.followup` (queued
* when the parent is busy); `quiet` delivery appends to the parent's next
* request through `Agent.inject`.
* @returns true when a report was emitted.
*/
function reportProgress(agents, sessions, config, lifecycle, child, now) {
	if (!config.autoReport || child.archived) return false;
	if (child.lastReportAt >= 0 && now - child.lastReportAt < config.reportThrottleMs) return false;
	const parent = agents.get(child.parentSessionId);
	if (parent === void 0) return false;
	const text = childLastText(sessions, child.childId);
	const line = text === "" ? `${child.label} completed a turn (no assistant output)` : `${child.label} completed a turn: ${boundLine(text, config.reportSummaryMaxChars)}`;
	const message = createUserMessage({
		content: [{
			type: "text",
			text: noticeLine(child.childId, "progress", line)
		}],
		source: {
			kind: "plugin",
			plugin: PLUGIN,
			form: "notice",
			summary: boundContextSummary(`${child.label} progress`)
		}
	});
	if (config.reportDelivery === "wakeup") parent.followup(message);
	else parent.inject(message);
	lifecycle.noteReport(child.childId, now);
	return true;
}
/**
* Archive one idle child: inject the archived notice into the live parent and
* request interruption of a resident activation. The stop request is exactly
* the official `interrupt` semantics — fire and return; teardown belongs to
* the continuation manager. A child whose live agent is mid-turn is left
* alone (a long tool execution emits no session events and would otherwise
* read as idle).
*/
function archiveChild(ctx, agents, config, lifecycle, child) {
	const parent = agents.get(child.parentSessionId);
	const liveChild = agents.get(child.childId);
	if (liveChild?.status === "running") return;
	if (parent !== void 0) parent.inject(createUserMessage({
		content: [{
			type: "text",
			text: noticeLine(child.childId, "archived", `${child.label} archived: idle for ${config.idleTimeoutMinutes} minutes; send bg_message to wake it or start a new background_agent`)
		}],
		source: {
			kind: "plugin",
			plugin: PLUGIN,
			form: "notice",
			summary: boundContextSummary(`${child.label} archived (idle timeout)`)
		}
	}));
	if (liveChild !== void 0 && parent !== void 0) try {
		ctx.subagents.interrupt(child.childId, {
			kind: "ancestor",
			agent: parent
		});
	} catch (error) {
		ctx.logger("background-agents").warn(`idle archive interrupt failed: ${String(error)}`);
	}
	lifecycle.archive(child.childId);
}
/**
* One sweep pass: archive quiet children past the idle window and drop cache
* entries whose parent and child agents are both gone (the parent log keeps
* the durable facts). Throwing archive notices are contained per child so one
* failure never skips a sibling.
*/
function sweepIdle(ctx, agents, config, lifecycle, now) {
	const timeoutMs = config.idleTimeoutMinutes * 6e4;
	for (const child of lifecycle.all()) {
		if (child.archived) {
			lifecycle.delete(child.childId);
			continue;
		}
		if (now - child.lastActivityAt >= timeoutMs) {
			try {
				archiveChild(ctx, agents, config, lifecycle, child);
			} catch (error) {
				ctx.logger("background-agents").warn(`idle archive failed for ${child.childId}: ${String(error)}`);
			}
			continue;
		}
		if (agents.get(child.childId) === void 0 && agents.get(child.parentSessionId) === void 0) lifecycle.delete(child.childId);
	}
}
/** Read the parent's projection value and return the archived agent ids, guarded. */
function archivedIdsFor(ctx, parent) {
	const registry = ctx.get("sessionProjections");
	if (registry === void 0) return [];
	return isBackgroundAgentsProjection(registry.snapshot(parent.session).values.backgroundAgents)?.agents.filter((entry) => entry.activity === "archived").map((entry) => entry.agentId) ?? [];
}
/**
* Count one parent's non-archived background agents for the cap. The durable
* listing is authoritative; when it is unavailable (projections or session
* store missing), the live registry is the honest fallback and the next
* start proceeds against it.
* @returns the current count, or undefined when the durable listing threw.
*/
async function countBackgroundAgents(ctx, parent, lifecycle, signal) {
	let entries;
	try {
		entries = await ctx.subagents.listChildren(parent.id, signal);
	} catch (error) {
		if (error instanceof SubagentError) return lifecycle.activeCountFor(parent.id);
		throw error;
	}
	const archivedIds = new Set(archivedIdsFor(ctx, parent));
	let count = 0;
	for (const entry of entries) {
		if (entry.kind !== "child" || entry.mode !== "continuable") continue;
		if (archivedIds.has(entry.id)) continue;
		count += 1;
	}
	return count;
}
/** The idle sweep timer, owned by the caller's effect. */
function startIdleSweep(ctx, agents, config, lifecycle) {
	const timer = setInterval(() => {
		try {
			sweepIdle(ctx, agents, config, lifecycle, Date.now());
		} catch (error) {
			ctx.logger("background-agents").warn(`idle sweep pass failed: ${String(error)}`);
		}
	}, config.idleSweepIntervalMs);
	return () => {
		clearInterval(timer);
	};
}
//#endregion
//#region src/projection.ts
/** Concatenate the text blocks of one user-role message. */
function messageText(message) {
	return message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
}
/** Return a new state whose entry for `agentId` carries `delta`; `base` fills unknown agents. */
function upsert(state, agentId, delta, base) {
	if (state.entries.some((entry) => entry.agentId === agentId)) return { entries: state.entries.map((entry) => entry.agentId === agentId ? {
		agentId,
		label: delta.label ?? entry.label,
		activity: delta.activity ?? entry.activity,
		messageCount: delta.messageCount ?? entry.messageCount,
		createdAt: delta.createdAt ?? entry.createdAt,
		lastActiveAt: delta.lastActiveAt ?? entry.lastActiveAt,
		...delta.lastMessage !== void 0 || entry.lastMessage !== void 0 ? { lastMessage: delta.lastMessage ?? entry.lastMessage } : {}
	} : entry) };
	const merged = {
		agentId,
		label: delta.label ?? base.label,
		activity: delta.activity ?? base.activity,
		messageCount: delta.messageCount ?? base.messageCount,
		createdAt: delta.createdAt ?? base.createdAt,
		lastActiveAt: delta.lastActiveAt ?? base.lastActiveAt,
		...delta.lastMessage !== void 0 || base.lastMessage !== void 0 ? { lastMessage: delta.lastMessage ?? base.lastMessage } : {}
	};
	return { entries: [...state.entries, merged] };
}
/**
* The registered projection unit. `stateVersion` bumps whenever the fold
* semantics or the serialized state fields change, so persisted checkpoint
* rows from an older unit refold instead of replaying into garbage.
*/
const backgroundAgentsProjectionDefinition = {
	key: "backgroundAgents",
	schema: backgroundAgentsSchema,
	init: () => ({ entries: [] }),
	apply(state, event) {
		switch (event.type) {
			case "tool/result": {
				const meta = isBackgroundAgentsMeta(event.data.meta);
				if (meta === void 0) return state;
				const shared = { lastActiveAt: event.time };
				const emptyBase = {
					label: "",
					activity: "running",
					messageCount: 0,
					createdAt: event.time,
					lastActiveAt: event.time
				};
				switch (meta.action) {
					case "registered": return upsert(state, meta.agentId, {
						label: meta.label,
						activity: "running",
						messageCount: 1,
						createdAt: event.time,
						...shared
					}, emptyBase);
					case "message": {
						const entry = state.entries.find((candidate) => candidate.agentId === meta.agentId);
						return upsert(state, meta.agentId, {
							activity: "running",
							messageCount: (entry?.messageCount ?? 0) + 1,
							...shared
						}, emptyBase);
					}
					case "stop":
						if (!state.entries.some((entry) => entry.agentId === meta.agentId)) return state;
						return upsert(state, meta.agentId, shared, emptyBase);
					/* v8 ignore next 2 -- the guard's closed switch is total by construction. */
					default: return state;
				}
			}
			case "user/message": {
				const source = event.data.source;
				if (source.kind === "plugin" && source.plugin === "dsh-background-agents" && source.form === "notice") {
					const head = parseNotice(messageText(event.data));
					if (head === void 0) return state;
					if (!state.entries.some((entry) => entry.agentId === head.agentId)) return state;
					const emptyBase = {
						label: "",
						activity: "running",
						messageCount: 0,
						createdAt: event.time,
						lastActiveAt: event.time
					};
					if (head.kind === "progress") return upsert(state, head.agentId, {
						activity: "running",
						lastMessage: head.text,
						lastActiveAt: event.time
					}, emptyBase);
					return upsert(state, head.agentId, {
						activity: "archived",
						lastActiveAt: event.time
					}, emptyBase);
				}
				if (source.kind === "subagent-settled") {
					if (!state.entries.some((entry) => entry.agentId === source.senderSessionId)) return state;
					return upsert(state, source.senderSessionId, {
						activity: "inactive",
						lastMessage: source.summary,
						lastActiveAt: event.time
					}, {
						label: "",
						activity: "inactive",
						messageCount: 0,
						createdAt: event.time,
						lastActiveAt: event.time
					});
				}
				return state;
			}
			default: return state;
		}
	},
	view: (state) => ({ agents: [...state.entries].sort((a, b) => a.createdAt !== b.createdAt ? a.createdAt - b.createdAt : a.agentId < b.agentId ? -1 : 1) }),
	stateVersion: 1
};
//#endregion
//#region src/tools.ts
/** First line of a task description, used as the default creation label. */
function firstLine(text) {
	const cut = text.indexOf("\n");
	return (cut === -1 ? text : text.slice(0, cut)).trim();
}
/** Bound one display label with an explicit ellipsis. */
function boundLabel(text, max) {
	const trimmed = text.trim();
	return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1)}…`;
}
/** Resolve the creation label: the optional argument, else the task's first line. */
function labelOf(args, config) {
	const explicit = args.label?.trim();
	return boundLabel(explicit === void 0 || explicit === "" ? firstLine(args.task) : explicit, config.maxLabelChars);
}
/**
* Validate one `tool_filter` argument against the deployment allowlist. The
* official descriptor rejects a filter without at least one of `allow`/`deny`,
* so the tool fails fast with the same rule plus the allowlist check.
* @param raw - the raw argument (already JSON-validated by defineTool).
* @param config - the deployment policy carrying `allowedChildTools`.
* @returns the trimmed filter, or undefined when the caller passed none.
*/
function validateToolFilter(raw, config) {
	if (raw === void 0) return void 0;
	const allow = raw.allow?.filter((name) => name.trim() !== "");
	const deny = raw.deny?.filter((name) => name.trim() !== "");
	if ((allow === void 0 || allow.length === 0) && (deny === void 0 || deny.length === 0)) throw new Error("tool_filter must declare allow and/or deny with at least one tool name");
	const limit = config.allowedChildTools;
	if (limit !== void 0 && limit.length > 0) {
		for (const name of [...allow ?? [], ...deny ?? []]) if (!limit.includes(name)) throw new Error(`tool_filter names "${name}", outside allowedChildTools: ${limit.join(", ")}`);
	}
	return {
		...allow !== void 0 && allow.length > 0 ? { allow } : {},
		...deny !== void 0 && deny.length > 0 ? { deny } : {}
	};
}
/**
* Validate one `max_depth` argument against the deployment ceiling. The seam
* enforces the same non-negative-safe-integer rule at start; the tool fails
* fast first and adds the configured ceiling.
*/
function validateMaxDepth(raw, config) {
	if (raw === void 0) return void 0;
	if (!Number.isSafeInteger(raw) || raw < 0) throw new Error(`max_depth must be a non-negative safe integer, got ${String(raw)}`);
	if (config.maxChildDepth !== void 0 && raw > config.maxChildDepth) throw new Error(`max_depth ${raw} exceeds the configured maxChildDepth=${config.maxChildDepth}`);
	return raw;
}
/** Read one parent's projection facts, guarded against an unmounted registry. */
function factsFor(ctx, parent) {
	const registry = ctx.get("sessionProjections");
	if (registry === void 0) return /* @__PURE__ */ new Map();
	const value = registry.snapshot(parent.session).values.backgroundAgents;
	const projection = isBackgroundAgentsProjection(value);
	return new Map((projection?.agents ?? []).map((entry) => [entry.agentId, entry]));
}
/**
* Build one bg_list row from a catalog entry's identity, overlaying the
* parent's projection facts and the live agent registry. Kept separate from
* the listing loops because `SubagentDescendantListEntry` is a strict
* superset of `SubagentListEntry`: forming their union would let TypeScript
* reduce the descendant members away, erasing `parentId`/`depth`.
*/
function buildRow(ctx, facts, id, label) {
	const fact = facts.get(id);
	const row = {
		agentId: id,
		label,
		mode: "continuable",
		activity: fact === void 0 ? activityOf(ctx, id, fallbackFact(id)) : activityOf(ctx, id, fact)
	};
	if (fact !== void 0) {
		if (fact.messageCount !== void 0) row.messageCount = fact.messageCount;
		if (fact.lastMessage !== void 0) row.lastMessage = fact.lastMessage;
		if (fact.createdAt !== void 0) row.createdAt = fact.createdAt;
		if (fact.lastActiveAt !== void 0) row.lastActiveAt = fact.lastActiveAt;
	}
	return row;
}
/** Derive one row's activity from the durable fact and the live agent registry. */
function activityOf(ctx, agentId, fact) {
	const live = ctx.agents.get(SessionId(agentId));
	if (fact.activity === "archived") return "archived";
	if (live?.status === "running") return "running";
	if (live !== void 0) return "idle";
	if (fact.activity === "inactive") return "settled";
	return "ready";
}
/**
* Register the four background-agent tools.
* @param ctx - context carrying tools, subagents, and the agent registry.
* @param config - provider, cap, and label bound.
* @param lifecycle - the live tracked-children registry.
*/
function registerBackgroundAgentTools(ctx, config, lifecycle) {
	ctx.tools.register(defineTool({
		name: "background_agent",
		description: "Start a background agent: a durable child agent session that keeps working while this conversation continues. It receives the task as its first message, runs it in its own context, and returns a stable agent id immediately. Track it with bg_list, watch its progress lines appear in this conversation (autoReport), send it more work any time with bg_message, read its settled result text with bg_result, and request a stop with bg_stop. Progress summaries are injected into this conversation after each of its turns and its final outcome arrives as a notice when it settles. Use this for long-running or parallel objectives you want to steer over time. Optionally scope the child: tool_filter removes tools from its view (never grants new ones), persona gives it a dedicated system-prompt persona, and max_depth caps its further delegation.",
		parameters: {
			task: {
				type: "string",
				required: true,
				description: "The complete task for the background agent, delivered as its first message. It does not share this conversation's context, so include everything it needs."
			},
			label: {
				type: "string",
				description: "Optional short display label (defaults to the task's first line, bounded by maxLabelChars)."
			},
			tool_filter: {
				type: "object",
				additionalProperties: false,
				description: "Optional tool scoping for the child: keep only the listed tools (allow) or remove them (deny). At least one of allow/deny with a tool name is required. Names must come from the deployment allowlist when one is configured (allowedChildTools). This can only restrict — never grant.",
				properties: {
					allow: {
						type: "array",
						items: { type: "string" },
						description: "Global tool names that stay visible to the child; everything else is removed."
					},
					deny: {
						type: "array",
						items: { type: "string" },
						description: "Global tool names removed from the child's visibility."
					}
				}
			},
			persona: {
				type: "string",
				description: "Optional per-child persona: a dedicated system-prompt section shadowing the deployment persona for this child alone."
			},
			max_depth: {
				type: "number",
				description: "Optional absolute cap on this child's further delegation depth (non-negative integer). Bounded by the configured maxChildDepth ceiling."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					agentId: {
						type: "string",
						required: true
					},
					messageId: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: `started background agent ${value.agentId}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "registered",
				agentId: value.agentId,
				label: labelOf(args, config)
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("background_agent requires a calling agent (exec.agent was undefined)");
			const provider = ctx.subagents.getProvider(config.provider);
			if (provider === void 0) throw new Error(`no subagent provider registered for "${config.provider}" — load a continuable-capable provider`);
			if (provider.prepareContinuable === void 0) throw new Error(`subagent provider "${config.provider}" does not support continuable children`);
			if (await countBackgroundAgents(ctx, parent, lifecycle, exec.signal) >= config.maxBackgroundAgents) throw new Error(`background agent limit reached: maxBackgroundAgents=${config.maxBackgroundAgents} non-archived agents; bg_stop one or wait for one to settle before starting more`);
			const label = labelOf(args, config);
			const toolFilter = validateToolFilter(args.tool_filter, config);
			const maxDepth = validateMaxDepth(args.max_depth, config);
			const persona = args.persona === void 0 || args.persona.trim() === "" ? void 0 : args.persona.trim();
			const agentOptions = config.childProvider !== void 0 || config.childModel !== void 0 ? {
				...config.childProvider !== void 0 ? { provider: config.childProvider } : {},
				...config.childModel !== void 0 ? { model: config.childModel } : {}
			} : void 0;
			const started = await ctx.subagents.startContinuable({
				provider: config.provider,
				label,
				request: {
					prompt: [{
						type: "text",
						text: args.task
					}],
					parent,
					...toolFilter !== void 0 ? { toolFilter } : {},
					...persona !== void 0 ? { persona } : {},
					...maxDepth !== void 0 ? { maxDepth } : {},
					...agentOptions !== void 0 ? { agentOptions } : {}
				},
				signal: exec.signal
			});
			lifecycle.register(started.childId, parent.id, label, Date.now());
			return {
				agentId: started.childId,
				messageId: started.messageId
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_message",
		description: "Send a message to a background agent by its agent id, continuing the same conversation. It becomes the agent's next turn: if it is still working, the message waits until its current turn finishes. This call returns no answer from the agent — only confirmation that the message was delivered — so use it to give it more work, correct its direction, or wake a settled agent. A failure means the message was NOT delivered.",
		parameters: {
			agent_id: {
				type: "string",
				required: true,
				description: "The agent id returned when the background agent was started."
			},
			message: {
				type: "string",
				required: true,
				description: "The message to deliver to the background agent."
			}
		},
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: { messageId: {
					type: "string",
					required: true
				} }
			},
			render: (args, _value) => [{
				type: "text",
				text: `message queued as the next turn for background agent ${args.agent_id}`
			}],
			presentationMeta: (args, value) => ({
				plugin: PLUGIN,
				action: "message",
				agentId: args.agent_id,
				messageId: value.messageId
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_message requires a calling agent (exec.agent was undefined)");
			const childId = SessionId(args.agent_id);
			const messageId = await ctx.subagents.followup(parent, childId, [{
				type: "text",
				text: args.message
			}], {
				source: {
					kind: "coordinator",
					form: "relay",
					senderSessionId: parent.id
				},
				signal: exec.signal
			});
			lifecycle.register(childId, parent.id, "", Date.now());
			return { messageId };
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_list",
		description: "List the background agents of this conversation with their durable ids, labels, activity, message counts, and last activity time. The listing merges the official child catalog (which recovers persisted children after a restart) with this plugin's dashboard facts. Activity comes from the live registry: running means the agent is working right now, idle means it is loaded but between turns, ready means it exists only in storage (resumable via bg_message), settled means its activation ended, and archived means the idle sweep parked it. Children the catalog could not read are reported as diagnostics instead of being dropped. With recursive: true the listing is the descendant tree (every row gains parentId and depth), where only direct children carry the dashboard facts. When the catalog itself is unavailable the result is an explicit unrecoverable marker, never a fabricated empty list.",
		parameters: { recursive: {
			type: "boolean",
			description: "List the whole descendant tree of this conversation (rows gain parentId and depth) instead of direct children only. Defaults to false."
		} },
		output: {
			schema: { oneOf: [{
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "listing"
					},
					agents: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								agentId: {
									type: "string",
									required: true
								},
								label: {
									type: "string",
									required: true
								},
								mode: {
									type: "string",
									required: true,
									const: "continuable"
								},
								activity: {
									type: "string",
									required: true,
									enum: [
										"running",
										"idle",
										"ready",
										"settled",
										"archived"
									]
								},
								parentId: { type: "string" },
								depth: { type: "number" },
								messageCount: { type: "number" },
								lastMessage: { type: "string" },
								createdAt: { type: "number" },
								lastActiveAt: { type: "number" }
							}
						}
					},
					diagnostics: {
						type: "array",
						required: true,
						items: {
							type: "object",
							additionalProperties: false,
							properties: {
								agentId: {
									type: "string",
									required: true
								},
								reason: {
									type: "string",
									required: true,
									enum: [
										"corrupt",
										"unsupported",
										"unavailable"
									]
								}
							}
						}
					}
				}
			}, {
				type: "object",
				additionalProperties: false,
				properties: {
					kind: {
						type: "string",
						required: true,
						const: "unrecoverable"
					},
					code: {
						type: "string",
						required: true
					},
					message: {
						type: "string",
						required: true
					}
				}
			}] },
			render: (_args, value) => {
				if (value.kind === "unrecoverable") return [{
					type: "text",
					text: `background agent listing unrecoverable: ${value.code}: ${value.message}`
				}];
				const lines = value.agents.map((agent) => `${agent.agentId} [${agent.activity}]${agent.messageCount === void 0 ? "" : ` messages=${agent.messageCount}`} — ${agent.label}`);
				const diagnostics = value.diagnostics.map((entry) => `${entry.agentId} [diagnostic: ${entry.reason}]`);
				const text = [...lines, ...diagnostics].join("\n");
				return [{
					type: "text",
					text: text === "" ? "(no background agents)" : text
				}];
			}
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_list requires a calling agent (exec.agent was undefined)");
			const facts = factsFor(ctx, parent);
			const agents = [];
			const diagnostics = [];
			if (args.recursive === true) {
				let entries;
				try {
					entries = await ctx.subagents.listDescendants(parent.id, exec.signal);
				} catch (error) {
					if (error instanceof SubagentError) return {
						kind: "unrecoverable",
						code: error.code,
						message: error.message
					};
					throw error;
				}
				for (const entry of entries) {
					if (entry.kind === "diagnostic") {
						diagnostics.push({
							agentId: entry.id,
							reason: entry.reason
						});
						continue;
					}
					if (entry.mode !== "continuable") continue;
					const row = buildRow(ctx, facts, entry.id, entry.label);
					row.parentId = entry.parentId;
					row.depth = entry.depth;
					agents.push(row);
				}
			} else {
				let entries;
				try {
					entries = await ctx.subagents.listChildren(parent.id, exec.signal);
				} catch (error) {
					if (error instanceof SubagentError) return {
						kind: "unrecoverable",
						code: error.code,
						message: error.message
					};
					throw error;
				}
				for (const entry of entries) {
					if (entry.kind === "diagnostic") {
						diagnostics.push({
							agentId: entry.id,
							reason: entry.reason
						});
						continue;
					}
					if (entry.mode !== "continuable") continue;
					agents.push(buildRow(ctx, facts, entry.id, entry.label));
				}
			}
			return {
				kind: "listing",
				agents,
				diagnostics
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_result",
		description: "Read the latest result text of a background agent by its agent id: the final assistant output of its child session, plus its current activity. The official settled notice only carries a summary, so use this to fetch the full closing text of a settled agent, or the latest output of one that is still working. An agent id that is not one of this conversation's tracked children is an error.",
		parameters: { agent_id: {
			type: "string",
			required: true,
			description: "The agent id returned when the background agent was started."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					agentId: {
						type: "string",
						required: true
					},
					activity: {
						type: "string",
						required: true,
						enum: [
							"running",
							"idle",
							"ready",
							"settled",
							"archived"
						]
					},
					text: { type: "string" }
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: value.text === void 0 ? `background agent ${value.agentId} has produced no assistant output yet` : value.text
			}]
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_result requires a calling agent (exec.agent was undefined)");
			const childId = SessionId(args.agent_id);
			let known = factsFor(ctx, parent).has(childId);
			if (!known) try {
				known = (await ctx.subagents.listChildren(parent.id, exec.signal)).some((entry) => entry.kind === "child" && entry.mode === "continuable" && entry.id === childId);
			} catch (error) {
				if (!(error instanceof SubagentError)) throw error;
			}
			if (!known) throw new Error(`background agent ${childId} is not one of this conversation's tracked children`);
			const fact = factsFor(ctx, parent).get(childId) ?? fallbackFact(childId);
			let session = ctx.sessions.get(childId);
			if (session === void 0) {
				const persistence = ctx.get("sessionPersistence");
				if (persistence !== void 0) session = await persistence.load(childId);
			}
			const text = session === void 0 ? "" : sessionLastText(session);
			return {
				agentId: childId,
				activity: activityOf(ctx, childId, fact),
				...text === "" ? {} : { text }
			};
		}
	}));
	ctx.tools.register(defineTool({
		name: "bg_stop",
		description: "Request a stop of a background agent's current turn by its agent id. Only the current turn stops: messages already queued for the agent stay parked until a later bg_message, and the agent itself stays available for follow-ups. This is a request, not a kill — the official control plane finishes the teardown, so the agent may keep running briefly. Stopping an already-settled agent is accepted. An agent id that is not one of this conversation's children reports not-found without touching anything.",
		parameters: { agent_id: {
			type: "string",
			required: true,
			description: "The agent id returned when the background agent was started."
		} },
		output: {
			schema: {
				type: "object",
				additionalProperties: false,
				properties: {
					outcome: {
						type: "string",
						required: true,
						enum: ["interrupt-requested", "not-found"]
					},
					agentId: {
						type: "string",
						required: true
					}
				}
			},
			render: (_args, value) => [{
				type: "text",
				text: value.outcome === "not-found" ? `background agent ${value.agentId} is not one of this conversation's children — nothing stopped` : `stop requested for background agent ${value.agentId}`
			}],
			presentationMeta: (args) => ({
				plugin: PLUGIN,
				action: "stop",
				agentId: args.agent_id
			})
		},
		isConcurrencySafe: () => true,
		async execute(args, exec) {
			const parent = exec.agent;
			if (!parent) throw new Error("bg_stop requires a calling agent (exec.agent was undefined)");
			const childId = SessionId(args.agent_id);
			let known = true;
			try {
				known = (await ctx.subagents.listChildren(parent.id, exec.signal)).some((entry) => entry.kind === "child" && entry.mode === "continuable" && entry.id === childId);
			} catch (error) {
				if (!(error instanceof SubagentError)) throw error;
			}
			if (!known) return {
				outcome: "not-found",
				agentId: childId
			};
			ctx.subagents.interrupt(childId, {
				kind: "ancestor",
				agent: parent
			});
			return {
				outcome: "interrupt-requested",
				agentId: childId
			};
		}
	}));
}
/** A fact-shaped fallback so rows without projection facts still resolve an activity. */
function fallbackFact(agentId) {
	const at = 0;
	return {
		activity: "running",
		agentId,
		label: "",
		messageCount: 0,
		createdAt: at,
		lastActiveAt: at
	};
}
//#endregion
//#region src/index.ts
const name = "background-agents";
/** Hard service dependencies: tools, the subagent runtime, the agent registry, and the session store. */
const inject = [
	"tools",
	"subagents",
	"agents",
	"sessions"
];
/**
* The single source of truth for every optional policy default: the schema
* materializes from it and apply() falls back to it, so the two can never
* drift apart.
*/
const DEFAULTS = {
	autoReport: true,
	reportThrottleMs: 15e3,
	reportSummaryMaxChars: 300,
	maxBackgroundAgents: 4,
	idleTimeoutMinutes: 120,
	idleSweepIntervalMs: 6e4,
	maxLabelChars: 120,
	reportDelivery: "quiet"
};
const Config = Schema.object({
	provider: Schema.string().required(),
	autoReport: Schema.boolean().default(DEFAULTS.autoReport),
	reportThrottleMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportThrottleMs),
	reportSummaryMaxChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.reportSummaryMaxChars),
	maxBackgroundAgents: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxBackgroundAgents),
	idleTimeoutMinutes: Schema.natural().min(1).max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleTimeoutMinutes),
	idleSweepIntervalMs: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.idleSweepIntervalMs),
	maxLabelChars: Schema.natural().max(Number.MAX_SAFE_INTEGER).default(DEFAULTS.maxLabelChars),
	reportDelivery: Schema.union([Schema.const("quiet"), Schema.const("wakeup")]).default(DEFAULTS.reportDelivery),
	childProvider: Schema.string(),
	childModel: Schema.string(),
	maxChildDepth: Schema.natural(),
	allowedChildTools: Schema.array(Schema.string())
});
/**
* Mount the four tools, the `backgroundAgents` projection unit, the
* throttled turn observer, and the idle-archive sweep.
* @param ctx - context carrying tools, subagents, and the agent registry.
* @param config - provider and lifecycle policy (Schemastery-validated).
*/
function apply(ctx, config) {
	const policy = {
		provider: config.provider,
		autoReport: config.autoReport ?? DEFAULTS.autoReport,
		reportThrottleMs: config.reportThrottleMs ?? DEFAULTS.reportThrottleMs,
		reportSummaryMaxChars: config.reportSummaryMaxChars ?? DEFAULTS.reportSummaryMaxChars,
		maxBackgroundAgents: config.maxBackgroundAgents ?? DEFAULTS.maxBackgroundAgents,
		idleTimeoutMinutes: config.idleTimeoutMinutes ?? DEFAULTS.idleTimeoutMinutes,
		idleSweepIntervalMs: config.idleSweepIntervalMs ?? DEFAULTS.idleSweepIntervalMs,
		maxLabelChars: config.maxLabelChars ?? DEFAULTS.maxLabelChars,
		reportDelivery: config.reportDelivery ?? DEFAULTS.reportDelivery,
		childProvider: config.childProvider,
		childModel: config.childModel,
		maxChildDepth: config.maxChildDepth,
		allowedChildTools: config.allowedChildTools
	};
	if (policy.provider.trim() === "") throw new Error("dsh-background-agents: `provider` must name a registered subagent provider");
	const lifecycle = new BackgroundAgentLifecycle();
	ctx.on("session/event", (session, event) => {
		const child = lifecycle.get(session.id);
		if (child === void 0) return;
		lifecycle.touch(session.id, event.time);
		if (event.type !== "turn/end") return;
		try {
			reportProgress(ctx.agents, ctx.sessions, policy, lifecycle, child, event.time);
		} catch (error) {
			ctx.logger("background-agents").warn(`progress report failed for ${child.childId}: ${String(error)}`);
		}
	});
	ctx.effect(() => startIdleSweep(ctx, ctx.agents, policy, lifecycle), "dsh-background-agents: idle sweep");
	ctx.inject(["sessionProjections"], (projectionCtx) => {
		projectionCtx.sessionProjections.register(backgroundAgentsProjectionDefinition);
	});
	registerBackgroundAgentTools(ctx, policy, lifecycle);
	ctx.inject(["systemPrompt"], (promptCtx) => {
		promptCtx.systemPrompt.section({
			name: "tool:background-agents",
			order: 107,
			text: "Track every background agent id you start. You are notified in-session when a background agent completes a turn (autoReport) and when it settles — do not busy-poll bg_list. Keep working on independent steps, use bg_message to steer an agent instead of waiting for it, read settled results with bg_result, and bg_stop agents that stopped mattering."
		});
	});
}
//#endregion
export { Config, DEFAULTS, apply, inject, name };
