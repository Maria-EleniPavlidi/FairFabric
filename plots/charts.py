import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from scipy.interpolate import make_interp_spline
from matplotlib.backends.backend_pdf import PdfPages

# -----------------------------
# 1. Load and Diagnostic Print
# -----------------------------
df_raw = pd.read_csv("staircase_summary.csv")

# Ensure derived metrics exist for filtering
if "avg_degree" not in df_raw.columns:
    df_raw["avg_degree"] = 2 * df_raw["number_of_edges"] / df_raw["number_of_nodes"]
if "density" not in df_raw.columns:
    df_raw["density"] = (2 * df_raw["number_of_edges"]) / (df_raw["number_of_nodes"] * (df_raw["number_of_nodes"] - 1))

# -----------------------------
# 2. Plotting Configuration
# -----------------------------
color_map = {
    "Total": {"bubble": "#9467bd", "line": "#4b0073", "label": "Quality ratio:\ntotal staircases"}, 
    "Red":   {"bubble": "#BE4F62", "line": "#8a2b3b", "label": "Quality ratio:\nred staircases"}, 
    "Blue":  {"bubble": "#5D8AA8", "line": "#3a5f78", "label": "Quality ratio:\nblue staircases"}  
}

plot_configs = [
    ("Total", "total_staircases_l2_0", "total_staircases_l2_05"),
    ("Red",   "red_staircases_l2_0",   "red_staircases_l2_05"),
    ("Blue",  "blue_staircases_l2_0",  "blue_staircases_l2_05")
]

def quality_subplot(ax, df, x_col, y_num_col, y_den_col, label, color_dict, ylabel_text=None, title=""):
    # 1. Basic Filter: Skip zeros to avoid infinity/errors
    df_plot = df[(df[y_num_col] > 0) & (df[y_den_col] > 0)].copy()
    
    # 2. SPECIFIC OUTLIER FILTER: 
    # Skip points where Avg Degree is approx 1.5 ONLY for Blue staircases
    if label == "Blue":
        # Using a small epsilon (0.05) to catch values like 1.5, 1.51, etc.
        df_plot = df_plot[~((df_plot["avg_degree"] >= 1.45) & (df_plot["avg_degree"] <= 1.55))]

    if df_plot.empty:
        return

    x = df_plot[x_col]
    y = np.ceil(df_plot[y_num_col] / df_plot[y_den_col])
    
    # Plot Bubbles
    ax.scatter(x, y, facecolors='none', edgecolors=color_dict["bubble"], 
               s=150, alpha=0.18, linewidth=1.8)
    
    # Median Line
    bins = np.linspace(np.min(x), np.max(x), 15)
    bin_centers = (bins[:-1] + bins[1:])/2
    medians = [
        np.median(y[(x >= bins[i]) & (x < bins[i+1])])
        if len(y[(x >= bins[i]) & (x < bins[i+1])]) > 0 else np.nan
        for i in range(len(bins)-1)
    ]
    mask = ~np.isnan(medians)
    
    if mask.sum() > 3:
        spl = make_interp_spline(np.array(bin_centers)[mask], np.array(medians)[mask], k=3)
        x_smooth = np.linspace(np.array(bin_centers)[mask].min(), np.array(bin_centers)[mask].max(), 200)
        y_smooth = spl(x_smooth)
        ax.plot(x_smooth, y_smooth, color=color_dict["line"], linewidth=4.5)
    
    # Styling
    ax.set_ylim(0, 20)
    ax.set_yticks(np.arange(1, 21, 2))
    ax.tick_params(axis='both', which='major', labelsize=14)
    
    if ylabel_text:
        ax.set_ylabel(ylabel_text, fontsize=16, fontweight='bold', labelpad=15)
        ax.tick_params(left=True, labelleft=True)
    else:
        ax.tick_params(left=True, labelleft=False)
    
    if title:
        ax.set_title(title, fontsize=18, pad=20, fontweight='bold')
    
    ax.grid(alpha=0.2, linestyle='--')
    ax.spines['top'].set_visible(False)
    ax.spines['right'].set_visible(False)

# -----------------------------
# 3. PDF Generation
# -----------------------------
columns = ["number_of_nodes", "number_of_edges", "density", "max_degree", "avg_degree"]
titles = ["Number of Nodes", "Number of Edges", "Density", "Max Degree", "Avg Degree"]

with PdfPages("staircase_quality_report_filtered.pdf") as pdf:
    for idx, (label, num_col, den_col) in enumerate(plot_configs):
        fig, axes = plt.subplots(1, 5, figsize=(28, 8), sharey=True)
        
        for i, (ax, col, title_str) in enumerate(zip(axes, columns, titles)):
            current_title = title_str if idx == 0 else ""
            current_ylabel = color_map[label]["label"] if i == 0 else None
            
            quality_subplot(ax, df_raw, col, num_col, den_col, label, color_map[label], 
                            ylabel_text=current_ylabel, title=current_title)
        
        plt.tight_layout()
        pdf.savefig(fig, bbox_inches='tight')
        plt.close(fig)

print("\n✅ Filtered PDF generated. The 1.5 Avg Degree artifact for Blue staircases has been skipped.")