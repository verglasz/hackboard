<script lang="ts">
  import type { PageData } from '.svelte-kit/types/src/routes/$types';
  import type { Person } from './+page.server';
  /* import SvelteTable from 'svelte-table'; */

  export let data: PageData;

  type ScoredPerson = Person & {
    rank: number;
    points: number;
    hintCount: number;
  };

  const rank = (p: Omit<ScoredPerson, 'rank'>) =>
    p.points + p.flags.length / 100 - p.hintCount / 10000;

  const haslasts = (p: ScoredPerson) => p.flags.length == 15 || p.flags.length == 16;

  let scoredPlayers: ScoredPerson[] = Object.values(data.players)
    .filter((p) => p.flags.length > 0)
    .map((p) => {
      let points = 0;
      let hintCount = 0;
      for (const f of p.flags) {
        let pt = 10;
        if (p.hints[f] !== undefined) {
          for (const h of p.hints[f]) {
            pt -= data.hp[f][h];
            hintCount += 1;
          }
        }
        if (pt > 0) points += pt;
      }
      return { ...p, points, hintCount };
    })
    .sort((a, b) => rank(b) - rank(a) + a.name.localeCompare(b.name) / 1e5)
    .map((p, i) => ({ rank: i + 1, ...p }));

  const resort = (property: string) => {
    const sorter = sorting[property];
    if (!sorter) return;
    sorter.sorted *= -1;
    const comparefn = (a: ScoredPerson, b: ScoredPerson) => {
      const x = sorter.fn(a);
      const y = sorter.fn(b);
      const result = x > y ? 1 : x < y ? -1 : 0;
      return sorter.sorted === -1 ? -result : result;
    };
    scoredPlayers = scoredPlayers.sort(comparefn);
  };

  const hitpoints = (p: ScoredPerson) => p.flags.length * 10 - p.points;

  const sorting: SortTable = {
    points: {
      sorted: 1,
      fn: (p) => p.points,
    },
    rank: {
      sorted: 1,
      fn: (p) => p.rank,
    },
    name: {
      sorted: -1,
      fn: (p) => p.name.toUpperCase(),
    },
    flags: {
      sorted: 1,
      fn: (p) => p.flags.length,
    },
    hintCount: {
      sorted: 1,
      fn: (p) => p.hintCount,
    },
    hitpoins: {
      sorted: 1,
      fn: hitpoints,
    },
  };

  type Sortation = { sorted: 0 | 1 | -1; fn: (p: ScoredPerson) => any };
  type SortTable = {
    [key: string]: Sortation;
  };
</script>

<div class="main">
  <h1 class="title">Ethack scoreboard</h1>
  <table>
    <thead>
      <tr>
        <th on:click={() => resort('rank')}>Position</th>
        <th on:click={() => resort('points')}>Total Points</th>
        <th on:click={() => resort('name')}>Name</th>
        <th on:click={() => resort('flags')}>Flags captured</th>
        <th on:click={() => resort('hintCount')}>Hints requested</th>
        <th on:click={() => resort('hitpoins')}>Total requested hint points</th>
      </tr>
    </thead>
    <tbody>
      {#each scoredPlayers as p}
        <tr>
          <th>{p.rank}</th>
          <td>{p.points}</td>
          <td>{p.name}</td>
          <td
            >{p.flags.length}{#if haslasts(p)}
              <span class="inco-note">*</span>
            {/if}</td
          >
          <td>{p.hintCount}</td>
          <td>{hitpoints(p)}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style lang="scss">
  table {
    padding: 1rem;
    table-layout: fixed;
    /* width: 80%; */
    border-collapse: collapse;
    border: 3px solid limegreen;
  }
  th,
  td {
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .inco-note {
    position: relative; /* making the .tooltip span a container for the tooltip text */
    color: #990000;
  }
  .inco-note:before {
    content: 'This participant may have finished the last flags during the grace period, so the score might not be accurate';
    position: absolute;

    /* vertically center */
    top: 50%;
    transform: translateY(-50%);

    /* move to right */
    left: 100%;
    margin-left: 15px; /* and add a small left margin */

    /* basic styles */
    width: 200px;
    padding: 10px;
    border-radius: 10px;
    background: #000;
    color: #fff;
    text-align: center;

    display: none; /* hide by default */
  }
  .inco-note:hover:before {
    display: block;
  }
</style>
