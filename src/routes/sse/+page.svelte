<script lang="ts">
  import Button from "$lib/components/ui/button/button.svelte";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Textarea } from "$lib/components/ui/textarea/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { onMount, onDestroy, tick } from "svelte";

  let username = $state("");
  let index = $state(0);
  let text: any = $state();
  let gotMessages = $state([]);
  let eventSource: EventSource;
  let chatContainer: HTMLDivElement;

  function scrollToBottom() {
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  $effect(() => {
    if (gotMessages.length) {
      scrollToBottom();
    }
  });

  onMount(async () => {
    eventSource = new EventSource("/sse/test");
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      gotMessages = data;
      console.log(data);
    };
    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      eventSource.close();
    };
  });

  onDestroy(() => {
    if (eventSource) {
      eventSource.close();
    }
  });

  async function handlePostMessage() {
    if (!username.trim() || !text?.trim()) return;

    let message = {
      username: username,
      text: text,
      index: index++,
    };
    const response = await fetch("/sse/test", {
      method: "POST",
      body: JSON.stringify(message),
    });
    console.log(response);
    text = "";
  }
</script>

<Button href="/">Back</Button>
<div class="flex justify-center items-center w-full">
  <div class="flex flex-col gap-2 w-full max-w-xs">
    <Input
      bind:value={username}
      type="text"
      placeholder="Username"
      class="w-full"
    />
    <Textarea
      bind:value={text}
      placeholder="Message"
      onkeydown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          handlePostMessage();
        }
      }}
    />
    <Button onclick={handlePostMessage}>Send</Button>
  </div>
</div>

<div class="flex justify-center items-center w-full mt-4">
  <div
    bind:this={chatContainer}
    class="w-full max-w-2xl border-2 rounded-xl shadow-xl h-96 p-4 overflow-auto scroll-smooth"
  >
    <div class="flex flex-col gap-3">
      {#each gotMessages as message}
        <div
          class="w-full flex {message.username === username
            ? 'justify-end'
            : 'justify-start'}"
        >
          <div
            class="{message.username === username
              ? 'bg-primary text-primary-foreground ml-12'
              : 'bg-secondary mr-12'} 
            p-3 rounded-lg shadow-md break-words max-w-[16rem]"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="font-semibold text-sm">
                {message.username === username ? "You" : message.username}
              </span>
              <span class="text-xs opacity-50">#{message.index}</span>
            </div>
            <p class="text-sm">{message.text}</p>
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>
