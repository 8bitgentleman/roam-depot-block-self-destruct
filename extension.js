
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

function getPageRefsNoAttribute(attribute, pageName){
    let query = `[:find (pull ?node [:block/string :create/time :block/uid])
        :in $ ?attrTitle ?destructTitle
        :where
        [?self-destruct :node/title ?destructTitle]   
        [?node :block/refs ?self-destruct]
        (not [?DestructTime-Attribute :node/title ?attrTitle]
            [?DestructTime :block/refs ?DestructTime-Attribute]
            [?DestructTime :block/parents ?node])
        ]`

    let result = window.roamAlphaAPI.q(query,attribute, pageName).flat();
            
    return result;
}

function getPageRefsWithAttribute(attribute, pageName){
    let query = `[:find (pull ?node [:block/string :create/time :block/uid])
        :in $ ?attrTitle ?destructTitle
        :where
        [?self-destruct :node/title ?destructTitle]   
        [?node :block/refs ?self-destruct]
        [?node :create/time ?created]
        [?node :block/uid ?uid]
        [?DestructTime-Attribute :node/title ?attrTitle]
        [?DestructTime :block/refs ?DestructTime-Attribute]
        [?DestructTime :block/parents ?node]
        [?DestructTime :block/string ?delay]
        ]`

    let result = window.roamAlphaAPI.q(query,attribute, pageName).flat();
            
    return result;
}

function getBlockWithAttribute(attribute, pageName){
    let query = `[:find
        (pull ?node [:block/string :node/title :block/uid :create/time :block/parents {:block/parents ...}])
        :in $ ?attrTitle ?destructTitle
        :where
            [?DestructDelay :node/title ?attrTitle]
            [?self-destruct :node/title ?destructTitle]
            [?node :block/refs ?DestructDelay]
            [?Parent :block/children ?node]
            [?Parent :block/refs ?self-destruct]
        ]`

    let result = window.roamAlphaAPI.q(query,attribute, pageName).flat();
            
    return result;
}

async function onload({extensionAPI}) {
    // set defaults if they dont' exist
    if (!extensionAPI.settings.get('tag')) {
        await extensionAPI.settings.set('tag', "self-destruct");
    }
    if (!extensionAPI.settings.get('attribute')) {
        await extensionAPI.settings.set('attribute', "Destruct Delay");
    }
    if (!extensionAPI.settings.get('timer')) {
        await extensionAPI.settings.set('timer', 1);
    }

    // wrap the react component so it can access extensionAPI
    const wrappedTimeConfig = () => timeButton({ extensionAPI });
    const panelConfig = {
        tabTitle: "Self-Destruct block",
        settings: [
            {id:	 "tag",
             name:   "Self-destruct tag",
             action: {type:		"input",
                      placeholder: "self-destruct"}},
    
            {id:	 "timer",
            name:   "Time Delay",
            description: React.createElement('p',{className: 'rm-settings-panel__description'},'Days until blocks self-destruct. This can be overridden with the ',React.createElement('b', null, 'Custom Time Attribute'),' attribute'),
            action: {type:	 "reactComponent",
                      component: wrappedTimeConfig}},
            
                      {id:	 "attribute",
            name:   "Custom Time Attribute",
            action: {type:		"input",
                    placeholder: "Destruct Delay"}},
        ]
    };
    extensionAPI.settings.panel.create(panelConfig);
    
    // first find all the refs for the self-destruct page without a custom attribute
    let pageRefsNoAttribute = getPageRefsNoAttribute(
        await extensionAPI.settings.get('attribute'),
        await extensionAPI.settings.get('tag')
        )
    // for each block check if it's older than the self-destruct limit. If so delete the block
    // I only check this on plugin load. This seems far simpler since I assume most people don't keep roam open infinitely 

    pageRefsNoAttribute.forEach(block => {
        let createTime = block['time'];
        let numDays = extensionAPI.settings.get('timer')
        // convert to days and do time math
        let offsetTime = new Date().getTime() - (numDays * 24 * 60 * 60 * 1000)
        if (createTime<offsetTime) {
            // if block is older than the timer delete it
            window.roamAlphaAPI.deleteBlock({"block":{"uid": block['uid']}})
            console.log(`self-destricting block ${block['uid']} - ${offsetTime} days old`);
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
    blockWithAttribute.forEach(block => {
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
            })
            
          }
          
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
