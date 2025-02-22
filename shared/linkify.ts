import LinkifyIt, {Match} from "linkify-it";
import tlds from "tlds";

export type NoSchemaMatch = Match & {
	noschema: boolean;
};

export type LinkPart = {
	start: number;
	end: number;
	link: string;
};

LinkifyIt.prototype.normalize = function normalize(match: NoSchemaMatch) {
	match.noschema = false;

	if (!match.schema) {
		match.schema = "http:";
		match.url = "http://" + match.url;
		match.noschema = true;
	}

	if (match.schema === "//") {
		match.schema = "http:";
		match.url = "http:" + match.url;
		match.noschema = true;
	}

	if (match.schema === "mailto:" && !/^mailto:/i.test(match.url)) {
		match.url = "mailto:" + match.url;
	}
};

const linkify = LinkifyIt().tlds(tlds).tlds("onion", true);

// Known schemes to detect in text
const commonSchemes = [
	"sftp",
	"smb",
	"file",
	"irc",
	"ircs",
	"svn",
	"git",
	"steam",
	"mumble",
	"ts3server",
	"svn+ssh",
	"ssh",
	"gopher",
	"gemini",
];

for (const schema of commonSchemes) {
	linkify.add(schema + ":", "http:");
}

linkify.add("web+", {
	validate(text: string, pos: number, self: LinkifyIt.LinkifyIt) {
		const webSchemaRe = /^[a-z]+:/gi;

		if (!webSchemaRe.test(text.slice(pos))) {
			return 0;
		}

		const linkEnd = self.testSchemaAt(text, "http:", pos + webSchemaRe.lastIndex);

		if (linkEnd === 0) {
			return 0;
		}

		return webSchemaRe.lastIndex + linkEnd;
	},
	normalize(match) {
		match.schema = match.text.slice(0, match.text.indexOf(":") + 1);
		LinkifyIt.prototype.normalize(match); // hand over to the global override
	},
});

export function findLinks(text: string) {
	const matches = linkify.match(text) as NoSchemaMatch[];

	if (!matches) {
		return [];
	}

	return matches.map(makeLinkPart);
}

export function findLinksWithSchema(text: string) {
	const matches = linkify.match(text) as NoSchemaMatch[];

	if (!matches) {
		return [];
	}

	return matches.filter((url) => !url.noschema).map(makeLinkPart);
}

function makeLinkPart(url: NoSchemaMatch): LinkPart {
	return {
		start: url.index,
		end: url.lastIndex,
		link: url.url,
	};
}
