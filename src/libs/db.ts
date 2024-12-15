import { User } from "../schemas/authSchema.ts";
import { ulid } from 'ulid';

const kv = Deno.openKv('./kv.db');

interface Token {
    token: string;
    issuedAt: Date;
    expiresAt: Date;
}

async function createUser(data: User) {
    const userId = ulid();
    const userKey = ["instructors", userId];
    const usernameKey = ["instructors", data.username];
    const emailKey = ["instructors", data.email];

    const userValues = await (await kv).get(userKey);
    const usernameValues = await (await kv).get(usernameKey);
    const emailValues = await (await kv).get(emailKey);
    data.id = userId;

    const res = await (await kv).atomic()
        .check({key: userKey, versionstamp: userValues.versionstamp})
        .check({key: usernameKey, versionstamp: usernameValues.versionstamp})
        .check({key: emailKey, versionstamp: emailValues.versionstamp})
        .set(userKey, data)
        .set(usernameKey, data)
        .set(emailKey, data)
        .commit();
    if (res.ok) {
        return {name: data.username, email: data.email};   
    } else {
        throw new Error('Email or Username already registered!');
    }
}

async function getUser(username: string) {
    const key = ['instructors', username];
    const user = (await kv).get<User>(key);
    const value = (await user).value;
    if (value){
        return value;
    } else {
        throw new Error('User does not exist!');
    }
}

async function getAllInstructors() {
    const prefix = ['instructors'];
    const entries = (await kv).list({prefix});

    const res = [];
    for await (const entry of entries) {
        res.push(entry.value);
    }

    return res;
}

async function getToken(userId: string) {
    const key = ['token', userId];

    const values = await (await kv).get<Token>(key);
    if (values.value) {
        return values.value;
    }
    throw new Error("No Such Token Found!");
}

async function getAllTokens() {
    const prefix = ['token'];
    const entries = (await kv).list({prefix});

    const res = [];
    for await (const entry of entries) {
        res.push(entry.value);
    }

    return res;
}

async function storeRefreshToken(
    token:string, 
    userId:string, 
    issuedAt:Date, 
    expiresAt:Date
) {
    const tokenKey = ['token', userId];
    const data = {
        token: token,
        issuedAt: issuedAt,
        expiresAt: expiresAt
    };

    const values = await (await kv).get(tokenKey);
    const res = await (await kv).atomic()
        .check({key: tokenKey, versionstamp: values.versionstamp})
        .set(tokenKey, data)
        .commit()

    if (res.ok) {
        return true;
    } else {
        throw new Error("Failed to Store refreshToken");
    }
}

async function deleteRefreshToken(userId: string) {
    const tokenKey = ['token', userId];
    const values = await (await kv).get(tokenKey);

    const res = await (await kv).atomic()
        .check({key: tokenKey, versionstamp: values.versionstamp})
        .delete(tokenKey)
        .commit()

    if (res.ok) {
        return true;
    } else {
        return false;
    }
}

const user = {
    create: createUser,
    user: getUser,
    createToken: storeRefreshToken,
    getToken: getToken,
    deleteToken: deleteRefreshToken,
    getInstructors: getAllInstructors,
    getTokens: getAllTokens
}

const db = {
    user: user
}

Object.freeze(db);
export default db;