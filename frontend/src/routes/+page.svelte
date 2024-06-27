<script lang="ts">
	import { type MetadataInput } from '$lib/schemas/MetadataInputSchema';
	import { ICalWeekday } from '$lib/vendor/IcalGeneratorTypes';
	import jsonUrl from 'json-url';
	import { DateTime } from 'luxon';

	import DateInput from './DateInput.svelte';
	import type { ChangeEventHandler } from 'svelte/elements';

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

	const labelsForWeekdays: { [key in ICalWeekday]: string } = {
		SU: 'Sunday',
		MO: 'Monday',
		TU: 'Tuesday',
		WE: 'Wednesday',
		TH: 'Thursday',
		FR: 'Friday',
		SA: 'Saturday'
	};

	const getLabelForWeekday = (key: string) => {
		if (key in labelsForWeekdays) {
			return labelsForWeekdays[key as keyof typeof ICalWeekday];
		}
		return '';
	};

	$: location = metadata.location ?? {
		address: '1B Maddox St, Alexandria NSW 2015',
		title: 'Perry Park Recreation Centre'
	};

	const updateLocation = () => (metadata.location = location);

	let compressed = '';
	const updateCompressed = async (md: MetadataInput) => {
		compressed = await jsonUrl('lzma').compress(md);
	};

	$: updateCompressed(metadata);

	let centreId: string;
	let teamID: string;

	const findSportfixIds = async (url: string) => {
		if (!url.startsWith('https://sportfix.net')) return;

		fetch(url)
			.then((response) => response.text())
			.then((body) => {
				console.log(body);
			});
	};

	const updateUrl: ChangeEventHandler<HTMLInputElement> = (e) => {
		//findSportfixIds(e.currentTarget.value)
	};
</script>

<h2>Season Intervals</h2>
<p>
	The start / end dates of the season.
	<br />
	Used to populate placeholder fixtures, and to ensure that the generated calendar events fall within
	the correct intervals.
	<br />
	Multiple intervals may be specified for non-continuous seasons (eg, seasons with a holiday break.)
</p>
<h3>Current Interval</h3>
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
<h3>Add New Interval</h3>
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
<p>
	Used to populate placeholder fixtures. A recurring event will be placed on each weekday across the
	specified hours.
</p>
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
<ul>
	{#each Object.keys(ICalWeekday) as weekday}
		<li>
			<label>
				<input
					type="radio"
					name="weekday"
					value={weekday}
					bind:group={fixtureTimes.weekday}
					on:change={() => (metadata.fixtureTimes = fixtureTimes)}
				/>
				{getLabelForWeekday(weekday)}
			</label>
		</li>
	{/each}
</ul>
<br />
<label>
	Timezone
	<input type="text" bind:value={metadata.timezone} />
</label>

<h2>Venue</h2>
<label>
	Address
	<input type="text" bind:value={location.address} on:change={() => updateLocation()} />
</label>
<label>
	Title
	<input type="text" bind:value={location.title} on:change={() => updateLocation()} />
</label>

<!--
<h2>Sportsfix Team Details URL</h2>
<p>
	Eg <code
		>https://sportfix.net/app/teamdetails.aspx?sportFixId=9cb1f735-da61-4f23-8da5-7f1f6a285a96&teamID=271722</code
	>
</p>
 <input type="text" on:change={updateUrl} />
 -->

<h2>Url Output</h2>
<pre>{compressed}</pre>
