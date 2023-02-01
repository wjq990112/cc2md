import fs from 'node:fs';
import path from 'node:path';
import { Project, SyntaxKind } from 'ts-morph';

const ROOT_DIR = path.join(__dirname, '../');
const COMP_DIR = path.join(ROOT_DIR, './components');
const COMP_PATH = path.join(COMP_DIR, './index.tsx');
const COMP_DOC_PATH = path.join(COMP_DIR, './README.md');

const p = new Project();
const s = p.addSourceFileAtPath(COMP_PATH);

// export default Button;
const [defaultExport] = s.getExportAssignments();

// Button
const componentName = defaultExport.getExpression().getText();
// const Button: FC<ButtonProps> = (props) => { //... };
const componentVariableStatement = s.getVariableStatementOrThrow(componentName);

const [componentJsDoc] = componentVariableStatement.getJsDocs();
// comment for Button
const componentComment = componentJsDoc.getCommentText();

// Button: FC<ButtonProps> = (props) => { //... }
const componentVariableDeclaration =
  s.getVariableDeclarationOrThrow(componentName);

// FC<PropsWithChildren<ButtonProps>>
const componentTypeReference = componentVariableDeclaration.getType();
// PropsWithChildren<ButtonProps>
const [fcTypeArgument] = componentTypeReference.getAliasTypeArguments();
// ButtonProps
const [propsTypeArgument] = fcTypeArgument.getAliasTypeArguments();
const propsTypeName = propsTypeArgument.getText();

// type ButtonProps = PropsWithChildren<{ // ... }>;
const propsTypeOrInterfaceDeclaration =
  s.getTypeAliasOrThrow(propsTypeName) || s.getInterfaceOrThrow(propsTypeName);

type PropsTableLine = {
  // 参数
  param: string;
  // 描述
  desc: string;
  // 类型
  type: string;
  // 默认值
  defaultValue: string;
};
type EventsTableLine = {
  // 事件名
  event: string;
  // 描述
  desc: string;
  // 回调参数
  callbackParams: string;
};

const props: PropsTableLine[] = [];
const events: EventsTableLine[] = [];

// type ButtonProps = { //... };
if (propsTypeOrInterfaceDeclaration.isKind(SyntaxKind.TypeAliasDeclaration)) {
  const propsTypeNode = propsTypeOrInterfaceDeclaration.getTypeNodeOrThrow();
  propsTypeNode.forEachChild((c) => {
    // size?: 'sm' | 'md' | 'lg';
    if (c.isKind(SyntaxKind.PropertySignature)) {
      const param = c.getName();
      const [descJsDoc] = c.getJsDocs();
      const desc = descJsDoc.getCommentText() ?? '-';
      const type =
        '`' + c.getTypeNodeOrThrow().getText().replace(/\|/g, '\\|') + '`';
      const defaultValue = '-';
      props.push({
        param,
        desc,
        type,
        defaultValue,
      });
    }
    // onClick?(): void;
    if (c.isKind(SyntaxKind.MethodSignature)) {
      const event = c.getName();
      const [descJsDoc] = c.getJsDocs();
      const desc = descJsDoc.getCommentText() ?? '';
      const callbackParams =
        '`' +
        c
          .getParameters()
          .map((p) => `${p.getName()}: ${p.getTypeNodeOrThrow().getText()}`)
          .join('\n') +
        '`';
      events.push({
        event,
        desc,
        callbackParams,
      });
    }
  });
}

// interface ButtonProps { // ... };
if (propsTypeOrInterfaceDeclaration.isKind(SyntaxKind.InterfaceDeclaration)) {
}

const propsTableHeader =
  '| 参数 | 说明 | 类型 | 默认值 |\n| --- | --- | --- | --- |';
const eventsTableHeader = '| 事件名 | 说明 | 回调参数 |\n| --- | --- | --- |';

const propsTable = props.reduce(
  (prev, curr) =>
    `${prev}\n| ${curr.param} | ${curr.desc} | ${curr.type} | ${curr.defaultValue} |`,
  propsTableHeader
);
const eventsTable = events.reduce(
  (prev, curr) =>
    `${prev}\n| ${curr.event} | ${curr.desc} | ${curr.callbackParams} |`,
  eventsTableHeader
);

const template = `# ${componentName}

## 描述

${componentComment}

## 属性

${propsTable}

## 事件

${eventsTable}
`;

fs.writeFileSync(COMP_DOC_PATH, template, { encoding: 'utf-8' });
