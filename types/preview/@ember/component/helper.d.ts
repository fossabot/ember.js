declare module '@ember/component/helper' {
  import EmberObject from '@ember/object';
  import { Opaque } from 'ember/-private/type-utils';
  import {
    DefaultNamed,
    DefaultPositional,
    EmptyObject,
    ExpandSignature,
    NamedArgs,
    PositionalArgs,
    Return,
  } from '@ember/component/-private/signature-utils';

  // Immediately re-export these.
  export { EmptyObject, ExpandSignature };

  /**
   * The public shape of a helper.
   * @deprecated Do not use this directly. Instead, write a `Signature` with the
   *   "normal" signature shape: `Args: { Named: { ... }, Positional: [...] }`.
   */
  export interface HelperSignature {
    NamedArgs?: DefaultNamed;
    PositionalArgs?: DefaultPositional;
    Return?: unknown;
  }

  /**
   * Ember Helpers are functions that can compute values, and are used in templates.
   * For example, this code calls a helper named `format-currency`:
   */
  export default class Helper<S = unknown> extends EmberObject {
    /**
     * In many cases, the ceremony of a full `Ember.Helper` class is not required.
     * The `helper` method create pure-function helpers without instances. For
     * example:
     */
    static helper<P extends DefaultPositional, N = EmptyObject, R = unknown>(
      helper: (positional: P, named: N) => R
    ): Helper<{ Args: { Positional: P; Named: N }; Return: R }>;
    /**
     * Override this function when writing a class-based helper.
     */
    compute(positional: PositionalArgs<S>, named: NamedArgs<S>): Return<S>;
    /**
     * On a class-based helper, it may be useful to force a recomputation of that
     * helpers value. This is akin to `rerender` on a component.
     */
    recompute(): void;
  }

  // The generic here is for a *signature*: a way to hang information for tools
  // like Glint which can provide type checking for component templates using
  // information supplied via this generic. While it may appear useless on this
  // class definition and extension, it is used by external tools and should not
  // be removed.
  export default interface Helper<S> extends Opaque<S> {}

  // This type exists to provide a non-user-constructible, non-subclassable
  // type representing the conceptual "instance type" of a function helper.
  // The abstract field of type `never` presents subclassing in userspace of
  // the value returned from `helper()`. By extending `Helper<S>`, any
  // augmentations of the `Helper` type performed by tools like Glint will
  // also apply to function-based helpers as well.
  export abstract class FunctionBasedHelperInstance<S> extends Helper<S> {
    protected abstract __concrete__: never;
  }

  /**
   * The type of a function-based helper.
   *
   * @note This is *not* user-constructible: it is exported only so that the type
   *   returned by the `helper` function can be named (and indeed can be exported
   *   like `export default helper(...)` safely).
   */
  // Making `FunctionBasedHelper` a bare constructor type allows for type
  // parameters to be preserved when `helper()` is passed a generic function.
  // By making it `abstract` and impossible to subclass (see above), we prevent
  // users from attempting to instantiate a return value from `helper()`.
  export type FunctionBasedHelper<S> = abstract new () => FunctionBasedHelperInstance<S>;

  /**
   * In many cases, the ceremony of a full `Helper` class is not required.
   * The `helper` method create pure-function helpers without instances. For
   * example:
   * ```app/helpers/format-currency.js
   * import { helper } from '@ember/component/helper';
   * export default helper(function(params, hash) {
   *   let cents = params[0];
   *   let currency = hash.currency;
   *   return `${currency}${cents * 0.01}`;
   * });
   * ```
   */
  // This overload allows users to write types directly on the callback passed to
  // the `helper` function and infer the resulting type correctly.
  export function helper<P extends DefaultPositional, N = EmptyObject, R = unknown>(
    helperFn: (positional: P, named: N) => R
  ): FunctionBasedHelper<{
    Args: {
      Positional: P;
      Named: N;
    };
    Return: R;
  }>;

  // This overload allows users to provide a `Signature` type explicitly at the
  // helper definition site, e.g. `helper<Sig>((pos, named) => {...})`. **Note:**
  // this overload must appear second, since TS' inference engine will not
  // correctly infer the type of `S` here from the types on the supplied callback.
  export function helper<S>(
    helperFn: (positional: PositionalArgs<S>, named: NamedArgs<S>) => Return<S>
  ): FunctionBasedHelper<{
    Args: {
      Positional: PositionalArgs<S>;
      Named: NamedArgs<S>;
    };
    Return: Return<S>;
  }>;

  export {};
}
