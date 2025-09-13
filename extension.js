
// store observers globally so they can be disconnected 
var runners = {
    intervals: [],
}
// dev
// const pluginStyleID = "plugin-style-uuid8a41b727-e9b4-4da3-9dad-4120b4c5c59c"
// production
const pluginStyleID = "plugin-style-8bitgentleman+self-destructing-blocks"
const  pluginTagStyleID = `plugin-style-8bitgentleman+self-destructing-blocks+hide-tag`

const defaultTemplatePages = ["roam/templates", "SmartBlock", "42SmartBlock"];

function getAllTemplatePages(extensionAPI) {
    const customEnabled = extensionAPI.settings.get('custom-templates-enabled');
    const customPages = extensionAPI.settings.get('custom-template-pages') || [];

    let allTemplatePages = [...defaultTemplatePages];

    if (customEnabled && Array.isArray(customPages) && customPages.length > 0) {
        allTemplatePages = [...allTemplatePages, ...customPages];
    }

    return allTemplatePages;
}

function getAllPages() {
    try {
        return window.roamAlphaAPI.q(`[:find ?title :where [?page :node/title ?title]]`).flat();
    } catch (error) {
        console.error('Error getting pages:', error);
        return [];
    }
}

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

function customTemplateInput({ extensionAPI }) {
    const [enabled, setEnabled] = React.useState(extensionAPI.settings.get('custom-templates-enabled') || false);
    const [customPages, setCustomPages] = React.useState(extensionAPI.settings.get('custom-template-pages') || []);
    const [inputValue, setInputValue] = React.useState('');
    const [suggestions, setSuggestions] = React.useState([]);
    const [showSuggestions, setShowSuggestions] = React.useState(false);

    const handleToggleChange = (isChecked) => {
        setEnabled(isChecked);
        extensionAPI.settings.set('custom-templates-enabled', isChecked);

        if (!isChecked) {
            setCustomPages([]);
            extensionAPI.settings.set('custom-template-pages', []);
        }
    };

    const handleInputChange = (value) => {
        setInputValue(value);

        if (value.length > 0) {
            const allPages = getAllPages();
            const filteredSuggestions = allPages
                .filter(page =>
                    page.toLowerCase().includes(value.toLowerCase()) &&
                    !customPages.includes(page) &&
                    !defaultTemplatePages.includes(page)
                )
                .slice(0, 10);
            setSuggestions(filteredSuggestions);
            setShowSuggestions(true);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const addTemplatePage = (pageName) => {
        const updatedPages = [...customPages, pageName];
        setCustomPages(updatedPages);
        extensionAPI.settings.set('custom-template-pages', updatedPages);
        setInputValue('');
        setShowSuggestions(false);
    };

    const removeTemplatePage = (pageToRemove) => {
        const updatedPages = customPages.filter(page => page !== pageToRemove);
        setCustomPages(updatedPages);
        extensionAPI.settings.set('custom-template-pages', updatedPages);
    };

    const handleKeyDown = (evt) => {
        if (evt.key === 'Enter' && inputValue.trim()) {
            evt.preventDefault();
            if (suggestions.length > 0) {
                addTemplatePage(suggestions[0]);
            } else if (inputValue.trim() && !customPages.includes(inputValue.trim())) {
                addTemplatePage(inputValue.trim());
            }
        }
    };

    return React.createElement(
        "div",
        null,
        React.createElement(
            "label",
            { className: "bp3-control bp3-switch", style: { marginBottom: "10px" } },
            React.createElement("input", {
                type: "checkbox",
                checked: enabled,
                onChange: (evt) => handleToggleChange(evt.target.checked)
            }),
            React.createElement("span", { className: "bp3-control-indicator" })
        ),

        enabled && React.createElement(
            "div",
            { style: { marginTop: "10px" } },

            React.createElement(
                "div",
                { style: { position: "relative", marginBottom: "10px" } },
                React.createElement("input", {
                    className: "bp3-input",
                    type: "text",
                    placeholder: "Add template page...",
                    value: inputValue,
                    style: { width: "100%" },
                    onChange: (evt) => handleInputChange(evt.target.value),
                    onKeyDown: handleKeyDown,
                    onFocus: () => inputValue.length > 0 && setShowSuggestions(true),
                    onBlur: () => setTimeout(() => setShowSuggestions(false), 150)
                }),

                showSuggestions && suggestions.length > 0 && React.createElement(
                    "div",
                    {
                        style: {
                            position: "absolute",
                            top: "100%",
                            left: "0",
                            right: "0",
                            backgroundColor: "white",
                            border: "1px solid #ccc",
                            color: "black",
                            borderRadius: "3px",
                            maxHeight: "200px",
                            overflowY: "auto",
                            zIndex: 1000,
                            boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
                        }
                    },
                    suggestions.map(suggestion =>
                        React.createElement(
                            "div",
                            {
                                key: suggestion,
                                style: {
                                    padding: "8px 12px",
                                    cursor: "pointer",
                                    borderBottom: "1px solid #eee"
                                },
                                onMouseDown: () => addTemplatePage(suggestion),
                                onMouseEnter: (e) => e.target.style.backgroundColor = "#f5f5f5",
                                onMouseLeave: (e) => e.target.style.backgroundColor = "white"
                            },
                            suggestion
                        )
                    )
                )
            ),

            customPages.length > 0 && React.createElement(
                "div",
                { style: { marginTop: "10px" } },

                customPages.map(page =>
                    React.createElement(
                        "div",
                        {
                            key: page,
                            style: {
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "4px 8px",
                                marginBottom: "4px",
                                backgroundColor: "#30404D",
                                borderRadius: "5px",
                                border: "solid 1px #293742",
                                fontSize: "1em"
                            }
                        },
                        React.createElement("span", null, page),
                        React.createElement(
                            "button",
                            {
                                style: {
                                    background: "none",
                                    border: "none",
                                    color: "#999",
                                    cursor: "pointer",
                                    fontSize: "16px",
                                    lineHeight: "1"
                                },
                                onClick: () => removeTemplatePage(page),
                                onMouseEnter: (e) => e.target.style.color = "#666",
                                onMouseLeave: (e) => e.target.style.color = "#999"
                            },
                            "×"
                        )
                    )
                )
            )
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
function iterateJSON(obj, templatePages) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {

        if (key=='title'&& templatePages.includes(obj[key])) {
            return true;
        }
        if (typeof obj[key] === "object") {
        //   console.log("--OBJECT")
        if (iterateJSON(obj[key], templatePages)) {
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
    if (!extensionAPI.settings.get('custom-templates-enabled')) {
        extensionAPI.settings.set('custom-templates-enabled', false);
    }
    if (!extensionAPI.settings.get('custom-template-pages')) {
        extensionAPI.settings.set('custom-template-pages', []);
    }
    if (extensionAPI.settings.get('hide-tag')==true) {
        hideTagStyle()
    }

    // wrap the react component so it can access extensionAPI
    const wrappedTimeConfig = () => timeButton({ extensionAPI });
    const wrappedCustomTemplateConfig = () => customTemplateInput({ extensionAPI });
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
            action:      {type:     "switch"}},

            {id:         "custom-template-pages",
            name:        "Custom Template Pages",
            description: "Add your own template pages that will be ignored during self-destruction (in addition to the default roam/templates, SmartBlock, and 42SmartBlock pages)",
            action:      {type:     "reactComponent",
                          component: wrappedCustomTemplateConfig}}
        ]
    };


    extensionAPI.settings.panel.create(panelConfig);
    
    // define the self destruction as a seperate function
    // this is within onload so it can access the extensionAPI
    async function selfDestruct(){
        let deletedBlocks = []
        // get combined template pages list (default + custom)
        const allTemplatePages = getAllTemplatePages(extensionAPI);
        console.log("all template pages: ", allTemplatePages);
        
        // first find all the refs for the self-destruct page without a custom attribute
        let pageRefsNoAttribute = getPageRefsNoAttribute(
            await extensionAPI.settings.get('attribute'),
            await extensionAPI.settings.get('tag')
            )

        let filteredBlocksNoAttribute = [];
        pageRefsNoAttribute.forEach(element => {
            if (!iterateJSON(element, allTemplatePages)) {
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
            await extensionAPI.settings.get('tag')
        );

        let filteredBlocksWithAttribute = [];
        blockWithAttribute.forEach(element => {
            if (!iterateJSON(element, allTemplatePages)) {
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
