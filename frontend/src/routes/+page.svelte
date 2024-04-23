<script lang="ts">
	import { type MetadataInput } from '$lib/schemas/MetadataInputSchema';
	import { ICalWeekday } from '$lib/vendor/IcalGeneratorTypes';
	import { DateTime } from 'luxon';
	import DateInput from './DateInput.svelte';

	let metadata: MetadataInput = {
		location: {
			address: '1B Maddox St, Alexandria NSW 2015',
			title: 'Perry Park Recreation Centre'
		},
		timezone: 'Australia/Sydney',
		seasonTimes: [
			{
				start: DateTime.fromFormat('2023-10-09', 'yyyy-MM-dd').toJSDate(),
				end: DateTime.fromFormat('2023-12-12', 'yyyy-MM-dd').toJSDate()
			}
		],
		fixtureTimes: {
			weekday: ICalWeekday.MO,
			startTime: {
				hour: 18,
				minute: 20
			},
			endTime: {
				hour: 23,
				minute: 0
			}
		}
	};

	const removeSeasonTime = (start: Date, end: Date) => {
		metadata.seasonTimes = metadata.seasonTimes.filter((v) => !(v.start == start && v.end == end));
	};

	let newSeason = {
		start: DateTime.fromFormat('2023-10-09', 'yyyy-MM-dd').toJSDate(),
		end: DateTime.fromFormat('2023-12-12', 'yyyy-MM-dd').toJSDate()
	};

	const addSeasonTime = (start: Date, end: Date) => {
		metadata.seasonTimes = [...metadata.seasonTimes, newSeason];
	};

	$: fixtureTimes = metadata.fixtureTimes ?? {
		weekday: ICalWeekday.MO,
		startTime: {
			hour: 18,
			minute: 20
		},
		endTime: {
			hour: 23,
			minute: 0
		}
	};
</script>

{@debug metadata}

<h2>Season Intervals</h2>
<h3>Current</h3>
<ul>
	{#each metadata.seasonTimes as seasonTime}
		<li>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>
				Start
				<DateInput bind:date={seasonTime.start} />
			</label>
			<!-- svelte-ignore a11y-label-has-associated-control -->
			<label>
				End
				<DateInput bind:date={seasonTime.end} />
			</label>
			<button on:click={() => removeSeasonTime(seasonTime.start, seasonTime.end)}>🗑️</button>
		</li>
	{/each}
</ul>
<h3>Add New</h3>
<ul>
	<li>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			Start
			<DateInput bind:date={newSeason.start} />
		</label>
		<!-- svelte-ignore a11y-label-has-associated-control -->
		<label>
			End
			<DateInput bind:date={newSeason.end} />
		</label>
		<button on:click={() => addSeasonTime(newSeason.start, newSeason.end)}>➕</button>
	</li>
</ul>
<h2>Fixture Times</h2>
<label>
    Starting Hour
    <input
        type="number"
        bind:value={fixtureTimes.startTime.hour}
        min="0"
        max="23"
        on:change={() => (metadata.fixtureTimes = fixtureTimes)}
    />
</label>
<label>
    Ending Hour
    <input
        type="number"
        bind:value={fixtureTimes.endTime.hour}
        min="0"
        max="23"
        on:change={() => (metadata.fixtureTimes = fixtureTimes)}
    />
</label>
<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
