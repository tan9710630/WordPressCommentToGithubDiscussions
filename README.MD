## WordPress导入Discussions

![](https://img.shields.io/badge/node-20.9.0-blue)

本项目基于nodejs环境开发运行，执行步骤如下：

#### 1、创建GITHUB仓库，并且开启Discussions功能，同时获取如下信息：

1. GITHUB账号的TOKEN；
2. 创建的仓库ID；
3. Discussions分类的ID；

#### 2、导出wordpress的xml（包括评论）

#### 3、安装依赖：

```shell
npm install
```

#### 4、修改代码配置：

```javascript
// 找到src/index.js文件，修改这些占位符
// 解析WordPress XML
const wpFactory = new WordPressFactory('Wordpress导出的XML');
const posts = await wpFactory.parse();

// 配置GitHub同步
const token = "GITHUB的token"; // 从环境变量获取token
const repoId = 'GITHUB Discussions 所在仓库ID'; // 仓库ID占位符
const categoryId = 'GITHUB Discussions的分类ID'; // 分类ID占位符
```

#### 5、执行导入：

```
node src/index.js
```

#### 6、结束

## 特别注意：

本项目使用的GITHUB的GraphqlAPI创建Discussions，这个API的请求是有限制的（[参考文档](https://docs.github.com/zh/graphql/overview/rate-limits-and-node-limits-for-the-graphql-api)），而且限制的策略特别复杂，并不是在请求之间停顿一两秒就可以搞定的，所以最好是自行修改代码，分批次执行导出。