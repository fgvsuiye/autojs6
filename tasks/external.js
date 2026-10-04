/**
 * 外部任务适配器
 *
 * 作用：把内置的外部任务函数包装成统一任务格式。
 * 使用：传入任务名称和原有函数，不重复声明或检查内置函数。
 */
function make(name, fn, tag) {
    return {
        name: name,
        tag: tag || "主程序",
        run: function (ctx) {
            try {
                return fn() !== false;
            } catch (e) {
                ctx.log.error("任务“" + name + "”异常：" + e);
                return false;
            }
        }
    };
}

module.exports = { make: make };
