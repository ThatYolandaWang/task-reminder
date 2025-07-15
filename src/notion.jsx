import { open as openShell } from "@tauri-apps/plugin-shell";
import Button from "./components/button"

const notionLink = "https://api.notion.com/v1/oauth/authorize?client_id=231d872b-594c-80b3-82c0-00376aa469f6&response_type=code&owner=user&redirect_uri=https%3A%2F%2Fwww.aifoto.app%2Fauth%2Fnotion%2Fcallback"
export default function NotionLoginButton() {

    async function handleLinkToNotion() {
        await openShell(notionLink)

        
    }

    return (
        <Button onClick={handleLinkToNotion}>链接到我的Notion</Button>
    )
}