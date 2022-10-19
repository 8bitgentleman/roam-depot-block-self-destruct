
function timeButton({ extensionAPI }) {
    // Declare a new state variable, which we'll call "count"
    const [count, setCount] = React.useState(extensionAPI.settings.get('timer'));

    return (
        React.createElement(
            "input",
            {className: "self-destruct-input bp3-input",
            type:"number",
            min:1,
            value: count,
            placeholder:count,
            onChange:	(evt) => { 
                setCount(evt.target.value)
                extensionAPI.settings.set('timer', evt.target.value)
            }},
        )
    );
}

function getPageRefs(pageName) {
    let queryText = `[:find (pull ?r [:block/uid :create/time])
        :in $ ?pagename   
        :where
        [?p :node/title ?pagename]
        [?r :block/refs ?p]
        [?r :block/page ?pr]]`
    return window.roamAlphaAPI.q(queryText, pageName);
}

async function onload({extensionAPI}) {
    // set defaults if they dont' exist
    if (!extensionAPI.settings.get('tag')) {
        await extensionAPI.settings.set('tag', "self-destruct");
    }
    if (!extensionAPI.settings.get('timer')) {
        await extensionAPI.settings.set('timer', 1);
    }

    // let the react component access extensionAPI
    const wrappedTimeConfig = () => timeButton({ extensionAPI });

    const panelConfig = {
        tabTitle: "Self-Destruct block",
        settings: [
            {id:	 "tag",
             name:   "Self-destruct tag",
             action: {type:		"input",
                      placeholder: "self-destruct",
                      onChange:	(evt) => { console.log( evt.target.value); }}},
    
            {id:	 "timer",
             name:   "Days until blocks self-destruct",
             action: {type:	 "reactComponent",
                      component: wrappedTimeConfig}}
        ]
    };

    extensionAPI.settings.panel.create(panelConfig);

    // get all the refs for the self-destruct page
    let pageRefs = getPageRefs(await extensionAPI.settings.get('tag'))

    // for each block check if it's older than the self-destruct limit. If so delete the block
    // I only check this on plugin load. This seems far simpler since I assume most people don't keep roam open infinitely 
    // maybe a bad assumption...

    pageRefs.forEach(block => {
        let createTime = block[0]['time'];
        let numDays = extensionAPI.settings.get('timer')
        let offsetTime = new Date().getTime() - (numDays * 24 * 60 * 60 * 1000)
        console.log("offset days", numDays, offsetTime)
        if (createTime<offsetTime) {
            console.log("delete", block)
            window.roamAlphaAPI.deleteBlock({"block":{"uid": block[0]['uid']}})
        }
        
    });

    console.log("load self-destruct plugin");
}

function onunload() {
    console.log("unload self-destruct plugin");
}
  
export default {
    onload,
    onunload
};
