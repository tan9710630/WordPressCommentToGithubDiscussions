export class Comment {
    constructor(data) {
        this.id = data.id;
        this.parentId = data.parentId; // 父评论ID
        this.author = data.author;
        this.content = data.content;
        this.date = new Date(data.date);
        this.replyTo = data.replyTo || null; // 可以是另一个Comment实例或Post实例
        this.replies = []; // 存储该评论的所有回复
    }

    // 添加回复
    addReply(reply) {
        this.replies.push(reply);
    }

    // 获取所有回复
    getReplies() {
        return this.replies;
    }

    toString() {
        const replyTarget = this.replyTo instanceof Comment ? 
            `回复评论 ${this.replyTo.id}` : 
            '回复文章';
        return `Comment by ${this.author} on ${this.date.toLocaleString()} (${replyTarget})`;
    }
} 