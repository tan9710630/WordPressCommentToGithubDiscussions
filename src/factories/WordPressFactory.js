import { DOMParser } from '@xmldom/xmldom';
import { Post } from '../models/Post.js';
import { Comment } from '../models/Comment.js';
import fs from 'fs';

export class WordPressFactory {
    constructor(xmlPath) {
        this.xmlPath = xmlPath;
    }

    async parse() {
        const xmlContent = fs.readFileSync(this.xmlPath, 'utf-8');
        const parser = new DOMParser();
        const doc = parser.parseFromString(xmlContent, 'text/xml');
        
        const posts = [];
        const postNodes = Array.from(doc.getElementsByTagName('item'));
        
        for (const postNode of postNodes) {
            // 检查是否是文章类型
            const postType = this.getNodeText(postNode, 'wp:post_type');
            if (postType !== 'post') {
                continue; // 跳过非文章类型
            }

            const post = new Post({
                id: this.getNodeText(postNode, 'wp:post_id'),
                title: this.getNodeText(postNode, 'title'),
                content: this.getNodeText(postNode, 'content:encoded'),
                date: this.getNodeText(postNode, 'wp:post_date')
            });

            // 先收集所有评论
            const commentNodes = Array.from(postNode.getElementsByTagName('wp:comment'));
            const comments = new Map(); // 用于存储评论ID到评论实例的映射

            // 第一遍：创建所有评论实例
            for (const commentNode of commentNodes) {
                const commentId = this.getNodeText(commentNode, 'wp:comment_id');
                const parentId = this.getNodeText(commentNode, 'wp:comment_parent');
                
                const comment = new Comment({
                    id: commentId,
                    parentId: parentId,
                    author: this.getNodeText(commentNode, 'wp:comment_author'),
                    content: this.getNodeText(commentNode, 'wp:comment_content'),
                    date: this.getNodeText(commentNode, 'wp:comment_date'),
                    replyTo: post // 默认回复到文章
                });
                
                comments.set(commentId, comment);
                post.addComment(comment);
            }

            // 第二遍：建立评论之间的父子关系
            for (const comment of comments.values()) {
                if (comment.parentId && comment.parentId !== '0') {
                    const parentComment = comments.get(comment.parentId);
                    if (parentComment) {
                        comment.replyTo = parentComment;
                        parentComment.addReply(comment); // 添加回复关系
                    }
                }
            }

            posts.push(post);
        }

        return posts;
    }

    getNodeText(node, tagName) {
        const elements = node.getElementsByTagName(tagName);
        return elements.length > 0 ? elements[0].textContent : '';
    }
} 