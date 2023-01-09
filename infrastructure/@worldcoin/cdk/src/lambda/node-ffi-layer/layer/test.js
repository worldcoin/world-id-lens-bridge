// from https://github.com/node-ffi-napi/node-ffi-napi#example
var ffi = require('ffi-napi')
var assert = require('assert')

var libm = ffi.Library('libm', {
  ceil: ['double', ['double']],
})
assert.strictEqual(libm.ceil(1.5), 2)

// You can also access just functions in the current process by passing a null
var current = ffi.Library(null, {
  atoi: ['int', ['string']],
})
assert.strictEqual(current.atoi('1234'), 1234)
console.info('ffi-napi Test successful')

// from https://github.com/node-ffi-napi/ref-napi#readme
var ref = require('ref-napi')

// so we can all agree that a buffer with the int value written
// to it could be represented as an "int *"
var buf = Buffer.alloc(4)
buf.writeInt32LE(12345, 0)

// using `ref`, you can set the "type", and gain magic abilities!
buf.type = ref.types.int

// now we can dereference to get the "meaningful" value
assert.strictEqual(buf.deref(), 12345)

// you can also get references to the original buffer if you need it.
// this buffer could be thought of as an "int **"
var one = buf.ref()

// and you can dereference all the way back down to an int
assert.strictEqual(one.deref().deref(), 12345)
console.info('ref-napi Test successful')
