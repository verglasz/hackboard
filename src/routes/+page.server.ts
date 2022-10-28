import data from './data.json';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';
import type { PageServerLoad } from '.svelte-kit/types/src/routes/$types';

export type Person = {
  // id: number;
  name: string;
  flags: string[];
  hints: Record<string, number[]>;
};

export const load: PageServerLoad<{
  hp: HitPoints;
  players: Record<number, Person>;
}> = async () => {
  const ret = {
    hp: await getHitPoints('src/routes/hitpoints.tsv'),
    players: await getPlayers(),
  };
  Object.values(ret.players)
    .filter((p) => p.name.includes('Asp, Pontus'))[0]
    .flags.push('d582aa');
  return ret;
};

type HitPoints = { [flag: string]: { [hint: number]: number } };

function getHitPoints(filename: string): Promise<HitPoints> {
  return new Promise((resolve, reject) => {
    const hitPoints: HitPoints = {};
    createReadStream(filename)
      .pipe(
        csvParser({
          separator: '\t',
          mapHeaders: ({ header }) => header.trim(),
          mapValues: ({ value }) => value.trim(),
        }),
      )
      .on('headers', (headers: string[]) => {
        if (JSON.stringify(headers) !== '["Flag","Hint","Point deduction"]')
          reject({ msg: 'Unexpected headers', headers });
      })
      .on('data', (data) => {
        const flag: string = data.Flag;
        const hintNo: number = parseInt(data.Hint);
        const pts = parseInt(data['Point deduction']);
        if (hitPoints[flag] !== undefined) {
          hitPoints[flag][hintNo] = pts;
        } else {
          hitPoints[flag] = { [hintNo]: pts };
        }
      })
      .on('end', () => resolve(hitPoints));
  });
}

async function getPlayers() {
  const flagRe = /Flag (?<flag>[a-f0-9]{6}) Info/;
  const hintRe = /Flag (?<flag>[a-f0-9]{6}) Hint (?<hint>\d)/;
  const players: Record<number, Person> = {};
  for (const group of data) {
    if (group.users.length < 10) continue; // weird broken groups
    const hint = hintRe.exec(group.name);
    if (hint !== null) {
      appendHint(players, group.users, hint.groups!.flag, parseInt(hint.groups!.hint));
      continue;
    }
    const flag = flagRe.exec(group.name);
    if (flag !== null) {
      appendFlag(players, group.users, flag.groups!.flag);
    } else {
      throw { msg: 'Data group entry is not flag nor int', group };
    }
  }
  return players;
}

function appendHint(
  players: Record<number, Person>,
  users: { id: number; sortable_name: string }[],
  flag: string,
  hint: number,
) {
  for (const u of users) {
    if (players[u.id] === undefined) {
      players[u.id] = { name: u.sortable_name, flags: [], hints: {} };
    }
    if (players[u.id].hints[flag] === undefined) {
      players[u.id].hints[flag] = [];
    }
    players[u.id].hints[flag].push(hint);
  }
}

function appendFlag(
  players: Record<number, Person>,
  users: { id: number; sortable_name: string }[],
  flag: string,
) {
  for (const u of users) {
    if (players[u.id] === undefined) {
      players[u.id] = { name: u.sortable_name, flags: [], hints: {} };
    }
    players[u.id].flags.push(flag);
  }
}
