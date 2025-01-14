export = jq;
declare function jq(moduleArg?: {}): Promise<any>;
declare namespace jq {
    export { jq as default };
}
