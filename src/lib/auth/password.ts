const PASSWORD_RULES = [
  {
    label: "密码长度至少需要 8 位",
    test: (value: string) => value.length >= 8,
  },
  {
    label: "密码至少需要 1 个大写字母",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    label: "密码至少需要 1 个小写字母",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    label: "密码至少需要 1 个数字",
    test: (value: string) => /\d/.test(value),
  },
  {
    label: "密码至少需要 1 个特殊字符",
    test: (value: string) => /[^A-Za-z0-9]/.test(value),
  },
] as const;

export function getPasswordIssues(password: string) {
  return PASSWORD_RULES.filter((rule) => !rule.test(password)).map(
    (rule) => rule.label,
  );
}

export function isPasswordValid(password: string) {
  return getPasswordIssues(password).length === 0;
}
