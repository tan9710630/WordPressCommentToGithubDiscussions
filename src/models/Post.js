import { Comment } from './Comment.js';

export class Post {
    constructor(data) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.date = new Date(data.date);
        this.comments = [];
        this.commentMap = new Map(); // 用于存储评论ID到评论实例的映射
    }

    addComment(comment) {
        this.comments.push(comment);
        this.commentMap.set(comment.id, comment);
    }

    getCommentById(id) {
        return this.commentMap.get(id);
    }

    toString() {
        return `Post: ${this.title} (${this.comments.length} comments)`;
    }
} 