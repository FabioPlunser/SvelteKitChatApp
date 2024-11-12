<script>
  import Button from "$lib/components/ui/button/button.svelte";
</script>

<div class="flex justify-center items-center w-full h-full mx-auto">
  <div class="mx-auto">
    <h1 class="text-2xl font-bold">
      This is a test site to show how to do real time communinaction in
      sveltekit
    </h1>
    <div class="mx-auto">
      <Button href="/sse">Using Server Sent Events</Button>
      <Button href="/socket">Using SocketIO</Button>
    </div>
  </div>
</div>
