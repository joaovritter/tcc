import { test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../app'
import * as userModel from '../models/userModel'


test('PUT /divisions salva a semana e GET devolve igual', async () => {
    const { token } = await registrarELogar()
})