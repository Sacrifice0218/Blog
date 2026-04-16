import type { DailyLog } from "../types";

const levelOneTopics = [
  "后端基础巩固",
  "数据库建模实战",
  "API 设计规范",
  "测试与调试",
  "工程化效率提升",
];

const levelTwoTopics = [
  "Spring Boot 结构梳理",
  "MySQL 索引策略",
  "RESTful 路由设计",
  "JUnit 用例拆分",
  "日志与监控基础",
];

const levelThreeTopics = [
  "依赖注入细节",
  "事务边界处理",
  "异常返回约定",
  "Mock 与断言",
  "性能瓶颈定位",
];

const fallbackTags = [
  ["spring", "ioc"],
  ["mysql", "index"],
  ["api", "restful"],
  ["test", "junit"],
  ["devops", "log"],
];

export const mockLogs: DailyLog[] = Array.from({ length: 10 }, (_, index) => {
  const day = index + 16;
  const dayPadded = String(day).padStart(2, "0");
  const date = `2026-04-${dayPadded}`;
  const topicIndex = index % levelOneTopics.length;

  return {
    date,
    title: `Day ${dayPadded} · 转行后端学习记录`,
    tags: fallbackTags[topicIndex],
    sections: [
      {
        level: 1,
        heading: levelOneTopics[topicIndex],
        content: [
          `今天围绕「${levelOneTopics[topicIndex]}」做了系统复盘，重点整理了可复用的知识框架与编码步骤。`,
        ],
      },
      {
        level: 2,
        heading: levelTwoTopics[topicIndex],
        content: [
          `通过一组可运行示例验证了「${levelTwoTopics[topicIndex]}」，并记录了常见误区与修正方法。`,
        ],
      },
      {
        level: 3,
        heading: levelThreeTopics[topicIndex],
        content: [
          `针对「${levelThreeTopics[topicIndex]}」补充了细节笔记，确保下次能在 30 分钟内快速复现完整流程。`,
        ],
      },
    ],
  };
});

