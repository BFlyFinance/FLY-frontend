import { SvgIcon, Link } from "@material-ui/core";
import GitHub from "../../assets/icons/github.svg";
import Twitter from "../../assets/icons/twitter.svg";
import Telegram from "../../assets/icons/telegram.svg";
import Discord from "../../assets/icons/discord.svg";

export default function Social() {
    return (
        <div className="social-row">
            {/* TODO: Replace social link  */}
            <Link href="https://github.com/Wonderland-Money/wonderland-frontend" target="_blank">
                <img src={GitHub} alt="GitHub" />
            </Link>

            <Link href="https://twitter.com/wonderland_fi?s=21" target="_blank">
                <img src={Twitter} alt="Twitter" />
            </Link>

            <Link href="https://t.me/joinchat/6UybL5rJMEhjN2Y5" target="_blank">
                <img src={Telegram} alt="Telegram" />
            </Link>

            <Link href="https://discord.gg/thDHseaHUt" target="_blank">
                <img src={Discord} alt="Discord" />
            </Link>
        </div>
    );
}
