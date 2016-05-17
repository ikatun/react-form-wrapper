import assign from 'lodash/assign';
import flatten from 'lodash/flatten';
import { List, Map } from 'immutable';

import { buildName, buildPath } from './pure-functions';

export default class Field {

  constructor(name, childName, parent) {
    
    const path = buildPath(name, parent._delimiter);

    Object.defineProperties(this, {
      parent: {
        value: parent
      },
      path: {
        value: path
      },
      valuePath: {
        value: flatten( buildPath(childName, parent._delimiter) )
      },
      isArray: {
        value: Array.isArray( path[ path.length - 1 ] )
      },
      childName: {
        value: childName
      },
      name: {
        value: name,
        enumerable: true
      },
      onChange: {
        value: parent.changeHandler,
        enumerable: true
      },
      value: {
        get() {
          return this.getValue();
        },
        enumerable: true
      },
      checked: {
        get() {
          const val = this.getValue();
          return typeof val === 'boolean' ? val : false;
        },
        enumerable: true
      },
      version: {
        get() {
          return parent.state ? parent.state.version : parent.props.version;
        },
        enumerable: true
      },
      key: {
        get() {
          return `${this.name}_${this.version}`;
        }
      }
    });

  }

  getValue(opts = {}) {
    const ctx = (this.parent.state && this.parent.state.value) || this.parent.props.value;
    let value;
    if (ctx && (Map.isMap(ctx) || List.isList(ctx))) {
      value = ctx.getIn(this.valuePath);
    }
    if (value == null && this.isArray) {
      value = List();
    }
    if (opts.toJS && (List.isList(value) || Map.isMap(value))) {
      return value.toJS();
    }
    return value == null ? '' : value;
  }

  checkIsArray() {
    if (!this.isArray) {
      throw new Error("Form Wrapper: Array functions can only be used on Array fields.")
    }
  }

  at(name, ...other) {
    return this.parent.getField(`${this.childName}${this.parent._delimiter}${name}`, ...other);
  }

  push(value) {
    this.checkIsArray();
    this.onChange({ op: 'add', path: this.path, value })
  }

  remove(index) {
    this.checkIsArray();
    this.onChange({ op: 'remove', path: [...this.path, index] });
  }

  withProps(props, opts) {
    props = props || {};
    opts = opts || {};
    const { toJS } = opts;
    const isFile = props.type === 'file';
    return assign(
      {},
      this,
      // key needs to stay the same until reset, then change
      toJS
        ? { value: this.getValue({ toJS }) }
        : isFile
          ? { value: undefined, key: this.key }
          : null,
      props
    );
  }

}
