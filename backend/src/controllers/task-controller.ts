import type { Context } from "hono";
import prismadb from "../lib/prisma.js";
export default {
    async createTask(c: Context) {
        try {
            const { description, xp, requirement, repeatable, max_repeat } = await c.req.json();
            await prismadb.tasks.create({
                data: {
                    description,
                    repeatable,
                    requirement,
                    max_repeat,
                    xp,
                }
            })
            return c.json({ data: "Task created successfully" })
        } catch (error: any) {
            console.log(`Error in creating task: ${error}`);
            return c.json({ message: error.message })
        }
    },
    async getTask(c: Context) {
        try {
            const address = c.req.query("address");
            const tasks = await prismadb.tasks.findMany();
            let claims: {
                address: string;
                id: number;
                task_id: number;
                xp_earned: number;
                repeat_counter: number | null;
                claimed_at: Date | null;
            }[] = [];
            if (address) {
                claims = await prismadb.task_claims.findMany({
                    where: {
                        address
                    }
                })
            };
            const data = [];
            for (let i = 0; i < tasks.length; i++) {
                const task = tasks[i];
                const userClaims = claims.filter(c => c.task_id === task.id);
                if (!address) {
                    data.push({
                        id: task.id,
                        description: task.description,
                        progress: 0,
                        xp: task.xp,
                        repeatable: task.repeatable,
                        claim_count: userClaims.length
                    })
                    continue;
                };
                const requirement = task.requirement;
                const { description, progress } = await checkTaskProgress(requirement, address, task.description, userClaims.length + 1);
                data.push({
                    id: task.id,
                    description,
                    progress,
                    xp: task.xp,
                    repeatable: task.repeatable,
                    claim_count: userClaims.length
                })
                continue;
            }
            return c.json({ data })
        } catch (error: any) {
            console.log(`Error in getting task: ${error}`);
            return c.json({ message: error.message })
        }
    },
    async claimTask(c: Context) {
        try {
           const { address } = c.get("jwtPayload");
            if(!address) throw new Error("You are not authorized to perform this action");
            const id = c.req.param("id");
            const task = await prismadb.tasks.findUnique({
                where: {
                    id: Number(id)
                }
            });
            if(!task) throw new Error("Task not found by id");
            const claims = await prismadb.task_claims.findMany({
                where: {
                    address,
                    task_id: task.id
                }
            });
            if(claims.length > 0 && task.repeatable === false) {
                throw new Error("You have already claimed this task")
            };
            const { progress } = await checkTaskProgress(task.requirement, address, task.description, claims.length + 1);
            if(progress < 100) throw new Error("Task is not completed yet");
            await prismadb.task_claims.create({
                data: {
                    address,
                    task_id: task.id,
                    xp_earned: task.xp,
                }
            });
            await prismadb.accounts.update({
                where: {
                    address
                },
                data: {
                    xp: {
                        increment: task.xp
                    },
                    xp_earned: {
                        increment: task.xp
                    }
                }
            });
            return c.json({ message: "Task claimed successfully" })

        } catch (error: any) {
            console.log(`Error in claim task: ${error}`);
            return c.json({ message: error.message })
        }
    }
}


async function checkTaskProgress(requirement: any, address: string, description: string | null, round?: number) {
    let progress = 0;
    let newDescription = description ?? "";
    if (requirement.action_type === "buy") {
        const buyTradesOfUser = await prismadb.trades.findMany({
            where: {
                user_addr: address,
                is_buy: true
            },
            select: {
                aptos_amount: true,
                token_amount: true,
                token_address: true
            }
        });
        if (requirement.token === "APT") {
            const amount = buyTradesOfUser.reduce((sum, acc) => sum + Number(acc.aptos_amount), 0);
            const amountRequired = round ? Number(requirement.amount) * round : Number(requirement.amount);
            progress = amountRequired > 0
                ? Math.min((amount / amountRequired) * 100, 100)
                : 0;
                newDescription = `Buy for ${amountRequired / Math.pow(10, 8)} ${requirement.token}`
        } else {
            const tokenTrades = buyTradesOfUser.filter(t => t.token_address === requirement.token_address);
            const amount = tokenTrades.reduce((sum, acc) => sum + Number(acc.token_amount), 0);
            const amountRequired = round ? Number(requirement.amount) * round : Number(requirement.amount);
            progress = amountRequired > 0
                ? Math.min((amount / amountRequired) * 100, 100)
                : 0;
             newDescription = `Buy ${amountRequired / Math.pow(10, 6)} ${requirement.token}`
        }
    } else if(requirement.action_type === "volume") {
        const tradesOfUser = await prismadb.trades.findMany({
            where: {
                user_addr: address,
            },
            select: {
                aptos_amount: true,
                token_amount: true,
                token_address: true
            }
        });
        if (requirement.token === "APT") {
            const amount = tradesOfUser.reduce((sum, acc) => sum + Number(acc.aptos_amount), 0);
            const amountRequired = round ? Number(requirement.amount) * round : Number(requirement.amount);
            progress = amountRequired > 0
                ? Math.min((amount / amountRequired) * 100, 100)
                : 0;
            newDescription = `Make a total volume of ${amountRequired / Math.pow(10, 8)} ${requirement.token}`
        } else {
            const tokenTrades = tradesOfUser.filter(t => t.token_address === requirement.token_address);
            const amount = tokenTrades.reduce((sum, acc) => sum + Number(acc.token_amount), 0);
            const amountRequired = round ? Number(requirement.amount) * round : Number(requirement.amount);
            progress = amountRequired > 0
                ? Math.min((amount / amountRequired) * 100, 100)
                : 0;
            newDescription = `Make a total volume of ${amountRequired / Math.pow(10, 6)} ${requirement.token}`
        }
    } else if(requirement.action_type === "connect-wallet") {
        const account = await prismadb.accounts.findUnique({
            where: {
                address
            }
        });
        if(account) {
            progress = 100
        }
    } else if(requirement.action_type === "connect-twitter") {
        const account = await prismadb.accounts.findUnique({
            where: {
                address
            }
        });
        if(account && account.x_id) {
            progress = 100
        }
    }
    return { progress, description }
}