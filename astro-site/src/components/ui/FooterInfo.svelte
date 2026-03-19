<script>
  import { onDestroy } from 'svelte';
  import { studentStore } from '../../stores/score.js';

  let turno = $state(studentStore.get().turno ?? '');
  const unsub = studentStore.subscribe(v => { turno = v.turno ?? ''; });
  onDestroy(unsub);
</script>

<span id="footer-lugar">{turno || 'CTP Platanares'}</span>
