import { WordPressFactory } from './factories/WordPressFactory.js';
import { GitHubSyncFactory } from './factories/GitHubSyncFactory.js';

async function main() {
    // 解析WordPress XML
    const wpFactory = new WordPressFactory('Wordpress导出的XML');
    const posts = await wpFactory.parse();

    // 配置GitHub同步
    const token = "GITHUB的token"; // 从环境变量获取token
    const repoId = 'GITHUB Discussions 所在仓库ID'; // 仓库ID占位符
    const categoryId = 'GITHUB Discussions的分类ID'; // 分类ID占位符

    const githubFactory = new GitHubSyncFactory(token, repoId, categoryId);

    console.log('开始同步到GitHub Discussions...');
    
    let beStart = false;
    // 同步每篇文章
    for (const post of posts) {
        if(post.comments.length == 0){
            continue;
        }
        if(post.title == 'vue集成lib-jitsi-meet'){
            beStart = true;
        }
        if(!beStart){
            continue;
        }
        try {
            console.log(`开始同步文章: ${post.title}`);
            const discussionNumber = await githubFactory.syncPost(post);
            console.log(`成功同步文章: ${post.title} (Discussion #${discussionNumber})`);
        } catch (error) {
            console.error(`同步文章失败: ${post.title}`, error.message);
            break;
        }
    }

    console.log('同步完成！');
}

main().catch(console.error); 