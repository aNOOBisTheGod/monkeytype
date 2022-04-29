import { InsertManyResult, InsertOneResult, ObjectId } from "mongodb";
import db from "../init/db";

async function addTask(
  taskName: string,
  taskArgs: any[]
): Promise<InsertOneResult<any>> {
  return await db.collection<any>("bot-tasks").insertOne({
    _id: new ObjectId(),
    name: taskName,
    args: taskArgs,
    executed: false,
    requestTimestamp: Date.now(),
  });
}

async function addTasks(
  tasks: string[],
  taskArgsArray: any[][]
): Promise<void | InsertManyResult> {
  if (tasks.length === 0 || tasks.length !== taskArgsArray.length) {
    return;
  }

  const normalizedTasks = tasks.map((taskName, index) => {
    return {
      _id: new ObjectId(),
      name: taskName,
      args: taskArgsArray[index],
      executed: false,
      requestTimestamp: Date.now(),
    };
  });

  return await db.collection("bot-tasks").insertMany(normalizedTasks);
}

class BotDAO {
  static async updateDiscordRole(discordId, wpm): Promise<InsertOneResult> {
    return await addTask("updateRole", [discordId, wpm]);
  }

  static async linkDiscord(uid, discordId): Promise<InsertOneResult> {
    return await addTask("linkDiscord", [discordId, uid]);
  }

  static async unlinkDiscord(uid, discordId): Promise<InsertOneResult> {
    return await addTask("unlinkDiscord", [discordId, uid]);
  }

  static async awardChallenge(
    discordId,
    challengeName
  ): Promise<InsertOneResult> {
    return await addTask("awardChallenge", [discordId, challengeName]);
  }

  static async announceLbUpdate(
    newRecords,
    leaderboardId
  ): Promise<InsertManyResult | void> {
    if (newRecords.length === 0) {
      return;
    }

    const leaderboardTasks = Array(newRecords.length).fill(
      "announceLeaderboardUpdate"
    );
    const leaderboardTasksArguments = newRecords.map((newRecord) => {
      return [
        newRecord.discordId ?? newRecord.name,
        newRecord.rank,
        leaderboardId,
        newRecord.wpm,
        newRecord.raw,
        newRecord.acc,
        newRecord.consistency,
      ];
    });

    return await addTasks(leaderboardTasks, leaderboardTasksArguments);
  }
}

export default BotDAO;
