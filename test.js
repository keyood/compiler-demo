const {
  tokenizer,
  parser,
  transformer,
  codeGenerator,
  compiler
} = require('./index')
let code = 'let a = 1'
let token = tokenizer(code)
console.log('------------token----------')
console.log(token)
let ast = parser(token)
console.log('-----------ast-----------')
console.log(JSON.stringify(ast))
let newAst = transformer(ast)
console.log('-----------newAst-----------')
console.log(JSON.stringify(newAst))
let newCode = codeGenerator(newAst)
console.log('-----------newCode-----------')
console.log(newCode)

let newCode2 = compiler(code)
console.log('-----------compiler-----------')
console.log(newCode2)
