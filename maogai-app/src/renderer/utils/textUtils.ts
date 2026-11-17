// 处理题目中的转义字符
export function unescapeText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\\./g, '.')  // \. -> .
    .replace(/\\\(/g, '(')  // \( -> (
    .replace(/\\\)/g, ')')  // \) -> )
    .replace(/\\\*/g, '*')  // \* -> *
    .replace(/\\\-/g, '-')  // \- -> -
    .replace(/\\\+/g, '+')  // \+ -> +
    .replace(/\\\?/g, '?')  // \? -> ?
    .replace(/\\\!/g, '!')  // \! -> !
    .replace(/\\\[/g, '[')  // \[ -> [
    .replace(/\\\]/g, ']')  // \] -> ]
    .replace(/\\\{/g, '{')  // \{ -> {
    .replace(/\\\}/g, '}')  // \} -> }
    .replace(/\\\|/g, '|')  // \| -> |
    .replace(/\\\^/g, '^')  // \^ -> ^
    .replace(/\\\$/g, '$')  // \$ -> $
    .replace(/\\\\/g, '\\'); // \\ -> \
}

// 处理题目对象中的所有文本字段
export function unescapeQuestion(question: any): any {
  if (!question) return question;
  
  const result = { ...question };
  
  // 处理题目文本
  if (result.question) {
    result.question = unescapeText(result.question);
  }
  
  // 处理选项
  if (result.options) {
    const newOptions: Record<string, string> = {};
    for (const [key, value] of Object.entries(result.options)) {
      newOptions[key] = unescapeText(value as string);
    }
    result.options = newOptions;
  }
  
  // 处理解析
  if (result.explanation) {
    result.explanation = unescapeText(result.explanation);
  }
  
  return result;
}
