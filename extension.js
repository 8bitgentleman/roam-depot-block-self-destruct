
// store observers globally so they can be disconnected 
var runners = {
    intervals: [],
}
// dev
// const pluginStyleID = "plugin-style-uuid8a41b727-e9b4-4da3-9dad-4120b4c5c59c"
// production
const pluginStyleID = "plugin-style-8bitgentleman+self-destructing-blocks"
const  pluginTagStyleID = `plugin-style-8bitgentleman+self-destructing-blocks+hide-tag`

const templatePages = ["roam/templates", "SmartBlock", "42SmartBlock"];

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

function getPageRefsNoAttribute(attribute, pageName){
    let query = `[:find (pull ?node [:block/string :create/time :block/refs :node/title :block/uid :block/parents {:block/refs ...}{:block/parents ...}])
    :in $ ?attrTitle ?destructTitle
    :where
    [?self-destruct :node/title ?destructTitle]   
    [?node :block/refs ?self-destruct]
    (not [?DestructTime-Attribute :node/title ?attrTitle]
        [?DestructTime :block/refs ?DestructTime-Attribute]
        [?DestructTime :block/parents ?node])
    (not [?SmartBlock :node/title "SmartBlock"] [?node :block/refs ?SmartBlock])
    (not [?roamtemplates :node/title "roam/templates"] [?node :block/refs ?roamtemplates])
    (not [?42SmartBlock :node/title "42SmartBlock"] [?node :block/refs ?42SmartBlock])
    (not [?roamtemplates :node/title "roam/templates"] [?node :block/page ?roamtemplates])
    (not [?SmartBlock :node/title "SmartBlock"] [?node :block/page ?SmartBlock])
    (not [?42SmartBlock :node/title "42SmartBlock"] [?node :block/page ?42SmartBlock])
    ]`

    let result = window.roamAlphaAPI.q(query,attribute, pageName).flat();
            
    return result;
}

function getBlockWithAttribute(attribute, pageName){
    let query = `[:find
        (pull ?node [:block/string :node/title :block/uid :create/time :block/parents :block/refs {:block/refs ...}{:block/parents ...}])
        :in $ ?attrTitle ?destructTitle
        :where
            [?DestructDelay :node/title ?attrTitle]
            [?self-destruct :node/title ?destructTitle]
            [?node :block/refs ?DestructDelay]
            [?Parent :block/children ?node]
            [?Parent :block/refs ?self-destruct]
            (not [?roamtemplates :node/title "roam/templates"] [?Parent :block/refs ?roamtemplates])
            (not [?42SmartBlock :node/title "42SmartBlock"] [?Parent :block/refs ?42SmartBlock])
            (not [?SmartBlock :node/title "SmartBlock"] [?Parent :block/refs ?SmartBlock])
            (not [?roamtemplates :node/title "roam/templates"] [?node :block/page ?roamtemplates])
            (not [?SmartBlock :node/title "SmartBlock"] [?node :block/page ?SmartBlock])
            (not [?42SmartBlock :node/title "42SmartBlock"] [?node :block/page ?42SmartBlock])
        ]`
    let result = window.roamAlphaAPI.q(query,attribute, pageName).flat();
            
    return result;
}

function removeTagStyle(tag) {
    if (document.getElementById(tag)) {
      document.getElementById(tag).remove();
    }
  }

// loop through all the parents of a block searching for template pages
// this is to filter out deeply nested templates
// there may be a way to do this with datalog but I kept getting false positives
function iterateJSON(obj) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
        
        if (key=='title'&& templatePages.includes(obj[key])) {
            return true;
        }
        if (typeof obj[key] === "object") {
        //   console.log("--OBJECT")
        if (iterateJSON(obj[key])) {
            return true;
            }
        }
        }
    }
    return false;
}

async function onload({extensionAPI}) {
    function hideTagStyle() {
        var head = document.getElementsByTagName("head")[0];
        var style = document.createElement("style");
        style.id = pluginTagStyleID;
        style.textContent =`
            span.rm-page-ref--tag[data-tag="${extensionAPI.settings.get('tag')}"],
            span[data-link-title="${extensionAPI.settings.get('tag')}"]{
                display:none;
            }
        `
        head.appendChild(style);
    }

    // set defaults if they dont' exist
    if (!extensionAPI.settings.get('tag')) {
        await extensionAPI.settings.set('tag', "self-destruct");
    } else{
        let style = document.getElementById(pluginStyleID);
        // swap out the style to target the existing tag
        style.innerHTML = style.innerHTML.replace(/span\.rm-page-ref--tag\[data-tag="[^"]+"\]/g, `span.rm-page-ref--tag[data-tag="${extensionAPI.settings.get('tag')}"]`)
        style.innerHTML = style.innerHTML.replace(/span\[data-link-title="[^"]+"\]/g, `span[data-link-title="${extensionAPI.settings.get('tag')}"]`);
    }
    if (!extensionAPI.settings.get('attribute')) {
        await extensionAPI.settings.set('attribute', "Destruct Delay");
    }
    if (!extensionAPI.settings.get('timer')) {
        await extensionAPI.settings.set('timer', 1);
    }
    if (!extensionAPI.settings.get('log-page')) {
        await extensionAPI.settings.set('log-page', false);
    }
    if (extensionAPI.settings.get('hide-tag')==true) {
        hideTagStyle()
    }

    // wrap the react component so it can access extensionAPI
    const wrappedTimeConfig = () => timeButton({ extensionAPI });
    const panelConfig = {
        tabTitle: "Self-Destructing Blocks",
        settings: [
            {id:	 "tag",
             name:   "Self-destruct tag",
             action: {type:		"input",
                      placeholder: "self-destruct",
                      onChange:    (evt) => { 
                        // console.log(evt.target.value)
                        let tag = evt.target.value;
                        let style = document.getElementById(pluginStyleID);

                        // swap out the style to target the new tag
                        // is this some kind of race condition because setting via the API is async?
                        style.innerHTML = style.innerHTML.replace(/span\.rm-page-ref--tag\[data-tag="[^"]+"\]/g, `span.rm-page-ref--tag[data-tag="${tag}"]`)
                        style.innerHTML = style.innerHTML.replace(/span\[data-link-title="[^"]+"\]/g, `span[data-link-title="${tag}"]`);

                    }}},
    
            {id:	 "timer",
            name:   "Time Delay",
            description: React.createElement('p',{className: 'rm-settings-panel__description'},'Days until blocks self-destruct. This can be overridden with the ',React.createElement('b', null, 'Custom Time Attribute'),' attribute'),
            action: {type:	 "reactComponent",
                      component: wrappedTimeConfig}},
            
                      {id:	 "attribute",
            name:   "Custom Time Attribute",
            action: {type:		"input",
                    placeholder: "Destruct Delay"}},
            {id:         "hide-tag",
            name:        "Hide Tag",
            description: "Hides the self-destruct tag",
            action:      {type:     "switch",
                            onChange: (evt) => { 
                            if (evt['target']['checked']) {
                                // create some style to hide the tag
                                hideTagStyle()
                            } else{
                               removeTagStyle(pluginTagStyleID)
                            }
                            }}},
            {id:         "log-page",
            name:        "Log Page",
            description: "Creates the page [[Self Destruct Log]] to keep track of every time the plugin runs and how many blocks were removed",
            action:      {type:     "switch"}}
        ]
    };


    extensionAPI.settings.panel.create(panelConfig);
    
    // define the self destruction as a seperate function
    // this is within onload so it can access the extensionAPI
    async function selfDestruct(){
        let deletedBlocks = []
        // first find all the refs for the self-destruct page without a custom attribute
        let pageRefsNoAttribute = getPageRefsNoAttribute(
            await extensionAPI.settings.get('attribute'),
            await extensionAPI.settings.get('tag')
            )

        let filteredBlocksNoAttribute = [];
        pageRefsNoAttribute.forEach(element => {
            if (!iterateJSON(element)) {
                filteredBlocksNoAttribute.push(element)
            }
        });

        // for each block check if it's older than the self-destruct limit. If so delete the block

        filteredBlocksNoAttribute.forEach(block => {
            let createTime = block['time'];
            let numDays = extensionAPI.settings.get('timer')
            // convert to days and do time math
            let offsetTime = new Date().getTime() - (numDays * 24 * 60 * 60 * 1000)
            if (createTime<offsetTime) {
                // if block is older than the timer delete it
                window.roamAlphaAPI.deleteBlock({"block":{"uid": block['uid']}})
                console.log(`self-destricting block ${block['uid']} - ${offsetTime} days old`);
                deletedBlocks.push(block)
            }
        });
        // bit more complicated for blocks with custom attributes
        // structure is assumed to be like this
        // - Parent Block #self-destruct
        //        -Destruct Delay::3
        let blockWithAttribute = getBlockWithAttribute(
            await extensionAPI.settings.get('attribute'),
            await await extensionAPI.settings.get('tag')
        );

        let filteredBlocksWithAttribute = [];
        blockWithAttribute.forEach(element => {
            if (!iterateJSON(element)) {
                filteredBlocksWithAttribute.push(element)
            }
        });
        filteredBlocksWithAttribute.forEach(block => {
            // split out the custom time delay from  ATTRIBUTE::VALUE
            let numDays = block['string'].split("::")[1];
            numDays = Number(numDays);
            if (!isNaN(numDays)){
            //if attr value is a number do time math
            let createTime = block['time'];
            let offsetTime = new Date().getTime() - (numDays * 24 * 60 * 60 * 1000);
            // if block is older than the custime time delay then delete it
            if (createTime<offsetTime) {
                //find the parent block that actually contains the self-destruct tag and delete that
                let tag = extensionAPI.settings.get('tag');
                //searching with regex for any of the various roam page/tag syntax
                let pattern = new RegExp(`#${tag}|\\[\\[${tag}\\]\\]|#\\[\\[${tag}\\]\\]`, "i");
                let parents = block.parents.filter(child => child.string && pattern.test(child.string));
                //cycle through and delete all the blocks that match
                parents.forEach(parent => {
                    window.roamAlphaAPI.deleteBlock({"block":{"uid": parent['uid']}})
                    console.log(`self-destricting block ${parent['uid']} - ${offsetTime} ms old`);
                    deletedBlocks.push(parent)
                })
                
            }
            
            }
            
        });
        
        if (extensionAPI.settings.get('log-page')==true && deletedBlocks.length>0) {
            const deletedUIDs = deletedBlocks.map(obj => obj.uid);
            let blockUIDs = deletedUIDs.join("`, `");
            blockUIDs = "`" + blockUIDs + "`";
            const phrase = (deletedUIDs.length > 1) ? 'blocks' : 'block';
            const time12hr = new Date().toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
            const DNP = roamAlphaAPI.util.dateToPageTitle(new Date);
            let blockString = `💣 ${deletedUIDs.length.toString()} ${phrase} self-destructed on [[${DNP}]] at ${time12hr}. Deleted blocks:\n ${blockUIDs}`
            let logPage = "Self-Destruct Log";
            try{
                await roamAlphaAPI.createPage({"page":{"title": 'Self-Destruct Log'}});
            } catch (error) {
            // code to handle the exception
            console.error('Page already exists');
            }
            
            let logUID = window.roamAlphaAPI.data.pull("[:block/uid]", [":node/title", logPage])[':block/uid']
                
            roamAlphaAPI.createBlock(
                {"location": 
                    {"parent-uid": logUID, 
                    "order": 0}, 
                "block": 
                    {"string": blockString}})
        }

    }

    // run the self-destruct on load once then run every hour. 
    // Otherwise it looks like the extension doesn't do anything
    await selfDestruct()
    // run selfDestruct every hour
    // the setInterval fn does not allow passing of variables
    // so I defined the fn within onload
    const intervalID = setInterval(selfDestruct, 60*60*1000)
 
    // add the interval to global runners so it can be removed later
    runners['intervals'] = [intervalID]
    console.log("load self-destruct plugin");
}

function onunload() {
    // iterate through runners and remove all setIntervals
    runners['intervals'].forEach((n) => clearInterval(n));
    // remove tag-hiding css
    removeTagStyle(pluginTagStyleID)
    console.log("unload self-destruct plugin");
}
  
export default {
    onload,
    onunload
};
