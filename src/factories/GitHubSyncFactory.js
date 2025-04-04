import { Octokit } from '@octokit/rest';
import { Comment } from '../models/Comment.js';

export class GitHubSyncFactory {
    constructor(token, repoId, categoryId) {
        this.octokit = new Octokit({
            auth: token
        });
        this.repoId = repoId;
        this.categoryId = categoryId;
        this.commentMap = new Map(); // 存储评论ID到GitHub评论ID的映射
    }

    async syncPost(post) {
        try {
            // 创建discussion
            const discussion = await this.octokit.graphql(`
                mutation {
                    createDiscussion(input: {
                        repositoryId: "${this.repoId}",
                        categoryId: "${this.categoryId}",
                        title: "${this.escapeMarkdown(post.title)}",
                        body: "${this.escapeMarkdown(post.title)}"
                    }) {
                        discussion {
                            id
                            number
                        }
                    }
                }
            `);

            const discussionId = discussion.createDiscussion.discussion.id;
            const discussionNumber = discussion.createDiscussion.discussion.number;

            // 同步评论（先同步顶级评论）
            const topLevelComments = post.comments.filter(comment => !comment.parentId || comment.parentId === '0');
            for (const comment of topLevelComments) {
                await this.syncCommentWithReplies(comment, discussionId, discussionNumber);
            }

            return discussionNumber;
        } catch (error) {
            console.error(`同步文章失败: ${post.title}`, error);
            throw error;
        }
    }

    async syncCommentWithReplies(comment, discussionId, discussionNumber) {
        try {
            // 添加延迟，避免评论太多导致API限制
            await new Promise(resolve => setTimeout(resolve, 3000));
            // 构建评论内容
            let commentBody = `**合并WordPress评论：**\n`;
            commentBody += `**评论时间：${comment.date.getFullYear()}年${String(comment.date.getMonth() + 1).padStart(2, '0')}月${String(comment.date.getDate()).padStart(2, '0')}日 ${String(comment.date.getHours()).padStart(2, '0')}:${String(comment.date.getMinutes()).padStart(2, '0')}:${String(comment.date.getSeconds()).padStart(2, '0')}**\n`;
            commentBody += `**评论作者：${comment.author}**\n`;
            
            // 如果是回复其他评论，在内容中注明原始回复关系
            // if (comment.replyTo instanceof Comment) {
            //     commentBody += `**回复评论：**\n`;
            //     commentBody += `> ${comment.replyTo.author} 发表于 ${comment.replyTo.date.toLocaleString()}\n`;
            //     commentBody += `> ${comment.replyTo.content}\n\n`;
            // }
            
            commentBody += `**评论内容：**\n\n${comment.content}\n`;

            // 创建评论
            const result = await this.octokit.graphql(`
                mutation {
                    addDiscussionComment(input: {
                        discussionId: "${discussionId}",
                        body: "${this.escapeMarkdown(commentBody)}"
                        ${comment.replyTo instanceof Comment ? `, replyToId: "${this.commentMap.get(comment.replyTo.id)}"` : ''}
                    }) {
                        comment {
                            id
                        }
                    }
                }
            `);

            // 存储GitHub评论ID
            this.commentMap.set(comment.id, result.addDiscussionComment.comment.id);

            // 递归同步回复
            const replies = comment.getReplies();
            for (const reply of replies) {
                // 如果是二级评论的回复（即三级及以下），修改其replyTo为一级评论
                if (comment.replyTo instanceof Comment) {
                    reply.replyTo = comment.replyTo;
                }
                await this.syncCommentWithReplies(reply, discussionId, discussionNumber);
            }
        } catch (error) {
            console.error(`同步评论失败: ${comment.id}`, error);
            throw error;
        }
    }

    escapeMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\\/g, '\\\\')  // 转义反斜杠
            .replace(/\n/g, '\\n')   // 转义换行符
            .replace(/\r/g, '\\r')   // 转义回车符
            .replace(/\t/g, '\\t')   // 转义制表符
            .replace(/"/g, '\\"')    // 转义双引号
            .replace(/\u0000/g, '')  // 移除空字符
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // 移除控制字符
            .replace(/\u2028/g, '')  // 移除行分隔符
            .replace(/\u2029/g, ''); // 移除段落分隔符
    }
} 