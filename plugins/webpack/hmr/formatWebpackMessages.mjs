import formatWebpackMessages from "react-dev-utils/formatWebpackMessages.js";

const customFormatter = (messages) =>
	formatWebpackMessages(
		["errors", "warnings"].reduce(
			(result, item) => {
				result[item] = result[item].concat(
					messages[item].map((stat) => stat.message),
				);
				return result;
			},
			{
				errors: [],
				warnings: [],
			},
		),
	);
export default customFormatter;
