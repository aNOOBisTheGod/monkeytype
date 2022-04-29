import { lock } from "../utils/misc";
import type IORedis from "ioredis";
import { Queue, QueueScheduler } from "bullmq";
import { isConnected } from "../init/redis";

const QUEUE_NAME = "george-tasks";

interface GeorgeTask {
  name: string;
  args: any[];
}

function buildGeorgeTask(task: string, taskArgs: any[]): GeorgeTask {
  return {
    name: task,
    args: taskArgs,
  };
}

class George {
  static jobQueue: Queue;
  static jobQueueScheduler: QueueScheduler;

  static initJobQueue(redisConnection: IORedis.Redis | undefined): void {
    this.jobQueue = new Queue(QUEUE_NAME, {
      connection: redisConnection,
      defaultJobOptions: {
        removeOnComplete: true,
        removeOnFail: true,
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 2000,
        },
      },
    });

    this.jobQueueScheduler = new QueueScheduler(QUEUE_NAME, {
      connection: redisConnection,
    });
  }

  static async updateDiscordRole(
    discordId: string,
    wpm: number
  ): Promise<void> {
    const task = "updateRole";
    const updateDiscordRoleTask = buildGeorgeTask(task, [discordId, wpm]);
    await this.jobQueue.add(task, updateDiscordRoleTask);
  }

  static async linkDiscord(discordId: string, uid: string): Promise<void> {
    const task = "linkDiscord";
    const linkDiscordTask = buildGeorgeTask(task, [discordId, uid]);
    await this.jobQueue.add(task, linkDiscordTask);
  }

  static async unlinkDiscord(discordId: string, uid: string): Promise<void> {
    const task = "unlinkDiscord";
    const unlinkDiscordTask = buildGeorgeTask(task, [discordId, uid]);
    await this.jobQueue.add(task, unlinkDiscordTask);
  }

  static async awardChallenge(
    discordId: string,
    challengeName: string
  ): Promise<void> {
    const task = "awardChallenge";
    const awardChallengeTask = buildGeorgeTask(task, [
      discordId,
      challengeName,
    ]);
    await this.jobQueue.add(task, awardChallengeTask);
  }

  static async announceLbUpdate(
    newRecords: any[],
    leaderboardId: string
  ): Promise<void> {
    const task = "announceLbUpdate";

    const leaderboardUpdateTasks = newRecords.map((record) => {
      const taskData = buildGeorgeTask(task, [
        record.discordId ?? record.name,
        record.rank,
        leaderboardId,
        record.wpm,
        record.raw,
        record.acc,
        record.consistency,
      ]);

      return {
        name: task,
        data: taskData,
      };
    });

    await this.jobQueue.addBulk(leaderboardUpdateTasks);
  }
}

export default lock(George, () => {
  return !isConnected();
});
