<script lang="ts">
    import { DateTime } from "luxon";
  
    export let format = "yyyy-MM-dd"
      export let date = new Date()
      
    let internal: string;
  
    const input = (x: Date) => (internal = DateTime.fromJSDate(x).toFormat(format))
    const output = (x: string) => (date = DateTime.fromFormat(x, format).toJSDate())
  
    $: input(date)
    $: output(internal)
  </script>
  
  <input type="date" bind:value={internal} />